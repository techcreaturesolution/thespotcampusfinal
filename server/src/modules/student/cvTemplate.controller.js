import tbl_cv_template from "./cvTemplate.model.js";
import tbl_resume from "./resume.model.js";
import tbl_student from "./student.model.js";
import { StatusCodes } from "http-status-codes";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";
import { BUILTIN_LAYOUTS } from "../../utils/cvTemplates.js";
import { generatePdfFromHtml } from "../../utils/pdfGenerator.js";


// Seed default templates helper
export const seedDefaultTemplates = async () => {
  // Auto-seeding disabled to prevent deleted templates from returning
  return;
};

// Admin CRUD Controllers
const getStyleByName = (name) => {
  const cleanName = (name || "").toLowerCase().trim();
  if (cleanName.includes("cv 1") || cleanName.includes("cv-1") || cleanName.includes("cv1")) {
    return "cv1";
  }
  if (cleanName.includes("cv 2") || cleanName.includes("cv-2") || cleanName.includes("cv2")) {
    return "cv2";
  }
  if (cleanName.includes("cv 3") || cleanName.includes("cv-3") || cleanName.includes("cv3")) {
    return "cv3";
  }
  return "cv1";
};

export const createTemplate = async (req, res) => {
  try {
    const { name } = req.body;
    let thumbnail = "";

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      thumbnail = response.secure_url;
    }

    if (!name) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Name is required" });
    }

    const selectedStyle = getStyleByName(name);
    const layoutConfig = BUILTIN_LAYOUTS[selectedStyle] || BUILTIN_LAYOUTS.cv1;

    const template = await tbl_cv_template.create({
      name,
      html_content: layoutConfig.html,
      css_content: layoutConfig.css,
      thumbnail,
    });

    res.status(StatusCodes.CREATED).json({ msg: "Template created successfully", template });
  } catch (error) {
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) { }
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await tbl_cv_template.findByIdAndDelete(id);
    res.status(StatusCodes.OK).json({ msg: "Template deleted successfully" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const template = await tbl_cv_template.findById(id);
    if (!template) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Template not found" });
    }

    if (name) {
      template.name = name;
      const selectedStyle = getStyleByName(name);
      const layoutConfig = BUILTIN_LAYOUTS[selectedStyle];
      if (layoutConfig) {
        template.html_content = layoutConfig.html;
        template.css_content = layoutConfig.css;
      }
    }

    if (req.file) {
      const response = await cloudinary.v2.uploader.upload(req.file.path);
      await fs.unlink(req.file.path);
      template.thumbnail = response.secure_url;
    }

    await template.save();
    res.status(StatusCodes.OK).json({ msg: "Template updated successfully", template });
  } catch (error) {
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) { }
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Student & Common Controllers
export const getAllTemplates = async (req, res) => {
  try {
    const templates = await tbl_cv_template.find({});
    for (const t of templates) {
      if (t.html_content.includes('class="header-card"') || 
          (t.html_content.includes('class="resume-header"') && !t.html_content.includes('class="resume-grid"')) ||
          (t.html_content.includes('class="resume-grid"') && !t.html_content.includes('<!-- creative v12_cv1 -->')) ||
          (t.html_content.includes('class="cv-container"') && !t.html_content.includes('class="cv-columns"') && !t.html_content.includes('<!-- creative v12_cv1 -->'))) {
        // This is the old creative layout! Let's update it to the new creative layout
        t.html_content = BUILTIN_LAYOUTS.cv1.html;
        t.css_content = BUILTIN_LAYOUTS.cv1.css;
        await t.save();
      } else if (t.html_content.includes('class="resume-sidebar"') || 
                 (t.html_content.includes('class="cv-columns"') && !t.html_content.includes('<!-- creative v12_cv2 -->'))) {
        // This is the old modern layout! Let's update it to the new modern layout
        t.html_content = BUILTIN_LAYOUTS.cv2.html;
        t.css_content = BUILTIN_LAYOUTS.cv2.css;
        await t.save();
      } else if (t.html_content.includes('class="contact-bar"') || 
                 (t.html_content.includes('class="pink-banner"') && !t.html_content.includes('<!-- creative v12_cv3 -->'))) {
        // This is the old classic layout! Let's update it to the new classic layout
        t.html_content = BUILTIN_LAYOUTS.cv3.html;
        t.css_content = BUILTIN_LAYOUTS.cv3.css;
        await t.save();
      }
    }

    const updatedTemplates = await tbl_cv_template.find({}).sort("-createdAt");
    res.status(StatusCodes.OK).json({ templates: updatedTemplates });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// Pure HTML Template Placeholder Compiler Helper
export const compileHtmlTemplate = (html, css, resumeData, student) => {
  const rData = typeof resumeData.toObject === "function" ? resumeData.toObject() : resumeData;
  const stud = typeof student.toObject === "function" ? student.toObject() : student;

  let compiledHtml = html || "";
  let compiledCss = css || "";

  // Helper to rename duplicate/nested outer loop tags to has_xxx
  const preprocessTemplateHtml = (tempHtml) => {
    let processed = tempHtml || "";
    const loopKeys = ["education", "experience", "projects", "skills", "certifications", "languages"];
    
    for (const key of loopKeys) {
      const openRegex = new RegExp(`\\{\\{\\s*#${key}\\s*\\\}\\}`, "gi");
      const closeRegex = new RegExp(`\\{\\{\\s*\\/${key}\\s*\\\}\\}`, "gi");
      
      const openMatches = [...processed.matchAll(openRegex)];
      const closeMatches = [...processed.matchAll(closeRegex)];
      
      if (openMatches.length > 1 && closeMatches.length > 1) {
        const firstOpen = openMatches[0];
        const lastClose = closeMatches[closeMatches.length - 1];
        
        const lastCloseIndex = lastClose.index;
        processed = processed.substring(0, lastCloseIndex) + 
                    `{{/has_${key}}}` + 
                    processed.substring(lastCloseIndex + lastClose[0].length);
                    
        const firstOpenIndex = firstOpen.index;
        processed = processed.substring(0, firstOpenIndex) + 
                    `{{#has_${key}}}` + 
                    processed.substring(firstOpenIndex + firstOpen[0].length);
      }
    }
    return processed;
  };

  compiledHtml = preprocessTemplateHtml(compiledHtml);

  const data = {
    name: stud?.student_name || "",
    student_name: stud?.student_name || "",
    email: stud?.student_email || "",
    student_email: stud?.student_email || "",
    contact: stud?.student_contact || "",
    student_contact: stud?.student_contact || "",
    degree: stud?.degree_id?.degree_name || stud?.degree || "",
    branch: stud?.branch_id?.branch_name || stud?.branch || "",
    college: stud?.college_id?.college_name || stud?.college || "",
    punch_line: rData.punch_line || "",
    summary: rData.chosen_summary || "",
    chosen_summary: rData.chosen_summary || "",
    linkedin: rData.linkedin || "",
    github: rData.github || "",
    portfolio: rData.portfolio || "",
    font_family: rData.font_family || "Inter",
    color_theme: rData.color_theme || "#3730a3",
    page_margin: rData.page_margin || "medium",
    layout_columns: rData.layout_columns || "two_column_left",
  };

  // 1. Process Loop Blocks FIRST
  const loopKeys = ["education", "experience", "projects", "skills", "certifications", "languages"];
  for (const key of loopKeys) {
    const regex = new RegExp(`\\{\\{\\s*#${key}\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*\\/${key}\\s*\\}\\}`, "gi");
    compiledHtml = compiledHtml.replace(regex, (match, innerContent) => {
      const list = rData[key] || [];
      if (list.length === 0) return "";
      
      return list.map((item) => {
        let renderedItem = innerContent;
        if (typeof item === "string") {
          const itemRegex = new RegExp(`\\{\\{\\s*(this|\\.|${key.slice(0, -1)})\\s*\\}\\}`, "gi");
          renderedItem = renderedItem.replace(itemRegex, item);
        } else {
          for (const [propKey, propVal] of Object.entries(item)) {
            if (Array.isArray(propVal)) {
              // Try to find loop tag first: {{#propKey}}...{{/propKey}}
              const innerLoopRegex = new RegExp(`\\{\\{\\s*#${propKey}\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*\\/${propKey}\\s*\\}\\}`, "gi");
              if (innerLoopRegex.test(renderedItem)) {
                renderedItem = renderedItem.replace(innerLoopRegex, (match, loopContent) => {
                  return propVal.map(subItem => {
                    return loopContent.replace(/\{\{\s*(this|\.)\s*\}\}/gi, subItem);
                  }).join("");
                });
              } else {
                // Fallback to comma separation
                const val = propVal.join(", ");
                const propRegex = new RegExp(`\\{\\{\\s*${propKey}\\s*\\}\\}`, "gi");
                renderedItem = renderedItem.replace(propRegex, val || "");
              }
            } else {
              const propRegex = new RegExp(`\\{\\{\\s*${propKey}\\s*\\}\\}`, "gi");
              renderedItem = renderedItem.replace(propRegex, propVal || "");
            }
          }
        }
        return renderedItem;
      }).join("");
    });
  }

  // 2. Process Conditional Blocks SECOND (e.g. {{#has_experience}}...{{/has_experience}} or {{#linkedin}}...{{/linkedin}})
  let conditionalRegex = /\{\{\s*#([a-zA-Z0-9_-]+)\s*\}\}([\s\S]*?)\{\{\s*\/\1\s*\}\}/gi;
  let matchesFound = true;
  
  while (matchesFound) {
    matchesFound = false;
    compiledHtml = compiledHtml.replace(conditionalRegex, (match, key, innerContent) => {
      matchesFound = true;
      const lowerKey = key.toLowerCase();
      
      // Check for "has_xxx" conditional
      if (lowerKey.startsWith("has_")) {
        const baseKey = lowerKey.substring(4);
        const list = rData[baseKey] || [];
        if (Array.isArray(list) && list.length > 0) {
          return innerContent;
        }
        return "";
      }
      
      // Simple fields check
      const value = data[lowerKey] !== undefined ? data[lowerKey] : rData[lowerKey];
      if (value && String(value).trim() !== "") {
        return innerContent;
      }
      return "";
    });
  }

  // 3. Replace simple placeholders: {{name}}, {{NAME}}, etc.
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    compiledHtml = compiledHtml.replace(regex, value || "");
  }

  // Inject font family & styles
  const fonts = {
    Inter: "'Inter', sans-serif",
    Outfit: "'Outfit', sans-serif",
    "Playfair Display": "'Playfair Display', serif",
    Roboto: "'Roboto', sans-serif",
  };
  const selectedFont = fonts[rData.font_family] || "'Inter', sans-serif";

  const marginValues = {
    small: { top: "10mm", bottom: "10mm", left: "12mm", right: "12mm" },
    medium: { top: "15mm", bottom: "15mm", left: "18mm", right: "18mm" },
    large: { top: "20mm", bottom: "20mm", left: "24mm", right: "24mm" },
  }[rData.page_margin] || { top: "15mm", bottom: "15mm", left: "18mm", right: "18mm" };

  const customStyleInjection = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap');
      
      :root {
        --primary-color: ${rData.color_theme || "#3730a3"};
        --primary-color-light: ${rData.color_theme || "#3730a3"}15;
      }
      
      body, .resume-wrapper, .resume-container, .cv-container {
        font-family: ${selectedFont} !important;
      }
      
      /* Color Accents */
      .accent-text { color: ${rData.color_theme} !important; }
      .accent-bg { background-color: ${rData.color_theme} !important; }
      .accent-border { border-color: ${rData.color_theme} !important; }
      .badge-accent { 
        background-color: ${rData.color_theme}0d !important; 
        color: ${rData.color_theme} !important;
        border: 1px solid ${rData.color_theme}25 !important;
      }
      
      /* Spacing & Page breaks */
      @media print {
        body { background: white; margin: 0; }
        @page { 
          size: A4; 
          margin: ${marginValues.top} ${marginValues.right} ${marginValues.bottom} ${marginValues.left} !important; 
        }
        .resume-wrapper, .resume-container, .cv-container {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          box-shadow: none !important;
        }
      }
    </style>
  `;

  compiledHtml = customStyleInjection + `\n<style>\n${compiledCss}\n</style>\n` + compiledHtml;
  return { compiledHtml, compiledCss };
};

// CV Compiler Controller (Compiles local HTML template)
export const compileResumeWithAi = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [student, resume] = await Promise.all([
      tbl_student.findById(studentId).populate("branch_id degree_id college_id"),
      tbl_resume.findOne({ student_id: studentId }),
    ]);

    if (!student) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Student profile not found." });
    }
    if (!resume) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Please fill and save your resume details first." });
    }

    let template;
    if (resume.selected_template_id) {
      template = await tbl_cv_template.findById(resume.selected_template_id);
    }
    if (!template) {
      template = await tbl_cv_template.findOne({});
    }
    if (!template) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "No CV Templates found. Admin needs to upload at least one template first!" });
    }

    const { compiledHtml, compiledCss } = compileHtmlTemplate(template.html_content, template.css_content || "", resume, student);

    resume.ai_compiled_html = compiledHtml;
    resume.ai_compiled_css = compiledCss;
    await resume.save();

    res.status(StatusCodes.OK).json({
      msg: "CV Compiled successfully",
      resume,
    });
  } catch (error) {
    console.error("CV Compile error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const downloadResumePdf = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [student, resume] = await Promise.all([
      tbl_student.findById(studentId).populate("branch_id degree_id college_id"),
      tbl_resume.findOne({ student_id: studentId }),
    ]);

    if (!student) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Student profile not found." });
    }
    if (!resume) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Please fill and save your resume details first." });
    }

    let template;
    if (resume.selected_template_id) {
      template = await tbl_cv_template.findById(resume.selected_template_id);
    }
    if (!template) {
      template = await tbl_cv_template.findOne({});
    }
    if (!template) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "No CV Templates found. Admin needs to upload at least one template first!" });
    }

    const { compiledHtml } = compileHtmlTemplate(template.html_content, template.css_content || "", resume, student);

    const pdfBuffer = await generatePdfFromHtml(compiledHtml);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
      'Content-Length': pdfBuffer.length
    });

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("CV PDF generation error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
