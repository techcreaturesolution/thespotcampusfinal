import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUser,
  FiBriefcase,
  FiBookOpen,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiZap,
  FiPrinter,
  FiLock,
  FiCheck,
  FiArrowRight,
  FiGlobe,
  FiCheckCircle,
  FiEye,
  FiEdit,
  FiMail,
  FiPhone,
  FiAward,
  FiCpu,
  FiX,
  FiLayers
} from "react-icons/fi";
import customFetch from "../../utils/customFetch";
import Loading from "../../common/components/Loading";
import RefreshButton from "../../common/components/RefreshButton";

// Local HTML Template Compiler
const compileHtmlTemplate = (html, css, resumeData, student) => {
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

const ResumeBuilder = () => {
  const { user } = useOutletContext() || {};
  const navigate = useNavigate();

  // Subscription State
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  // Resume builder UI states
  const [activeTab, setActiveTab] = useState("profile");
  const [showPreview, setShowPreview] = useState(false); // Mobile toggle
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);
  const [editorMode, setEditorMode] = useState("content"); // content or design
  
  // Lists fetched from DB
  const [templates, setTemplates] = useState([]);
  
  // Form input states
  const [resumeData, setResumeData] = useState({
    punch_line: "",
    linkedin: "",
    github: "",
    portfolio: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: [],
    chosen_summary: "",
    selected_template_id: "",
    ai_compiled_html: "",
    ai_compiled_css: "",
    font_family: "Inter",
    color_theme: "#3730a3",
    layout_columns: "two_column_left",
    page_margin: "medium",
  });

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummaries, setAiSummaries] = useState([]);

  // State to hold temporary inputs for lists
  const [tempSkill, setTempSkill] = useState("");
  const [tempCert, setTempCert] = useState("");
  const [tempLang, setTempLang] = useState("");

  const [eduInput, setEduInput] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: "",
    endYear: "",
    score: "",
  });

  const [expInput, setExpInput] = useState({
    company: "",
    role: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const [projInput, setProjInput] = useState({
    title: "",
    description: "",
    technologies: "",
    link: "",
  });

  // Fetch subscription status, templates and existing resume data
  const loadData = async () => {
    try {
      const [subRes, resumeRes, templatesRes] = await Promise.all([
        customFetch.get("/payment/check"),
        customFetch.get("/student/resume/me"),
        customFetch.get("/cv-templates"),
      ]);

      setHasSubscription(subRes.data.hasSubscription);
      setTemplates(templatesRes.data.templates || []);
      
      if (resumeRes.data?.resume) {
        const loaded = resumeRes.data.resume;
        setResumeData({
          punch_line: loaded.punch_line || "",
          linkedin: loaded.linkedin || "",
          github: loaded.github || "",
          portfolio: loaded.portfolio || "",
          education: loaded.education || [],
          experience: loaded.experience || [],
          projects: loaded.projects || [],
          skills: loaded.skills || [],
          certifications: loaded.certifications || [],
          languages: loaded.languages || [],
          chosen_summary: loaded.chosen_summary || "",
          selected_template_id: loaded.selected_template_id || "",
          ai_compiled_html: loaded.ai_compiled_html || "",
          ai_compiled_css: loaded.ai_compiled_css || "",
          font_family: loaded.font_family || "Inter",
          color_theme: loaded.color_theme || "#3730a3",
          layout_columns: loaded.layout_columns || "two_column_left",
          page_margin: loaded.page_margin || "medium",
        });
        setAiSummaries(loaded.ai_summaries || []);
      }
    } catch (error) {
      console.error("Failed to load CV data", error);
      toast.error("Error loading CV builder details");
    } finally {
      setCheckingSubscription(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (silent = false) => {
    setIsSaving(true);
    try {
      const payload = { ...resumeData };
      if (!payload.selected_template_id || payload.selected_template_id === "") {
        delete payload.selected_template_id;
      }
      const { data } = await customFetch.post("/student/resume/me", payload);
      setResumeData(data.resume);
      if (!silent) {
        toast.success("CV Details saved successfully!");
      }
      return data.resume;
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to save CV details");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const changeTemplate = async (templateId) => {
    const updated = {
      ...resumeData,
      selected_template_id: templateId,
    };
    setResumeData(updated);
    try {
      await customFetch.post("/student/resume/me", updated);
      toast.info("Selected template saved.");
    } catch {
      console.error("Failed to auto-save template option");
    }
  };

  const handleGenerateAiSummaries = async () => {
    if (!resumeData.skills || resumeData.skills.length === 0) {
      toast.error("Please add some skills first before generating summaries!");
      setActiveTab("skills"); // Switch to skills tab
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const payload = {
        skills: resumeData.skills,
        projects: resumeData.projects,
        education: resumeData.education,
        punch_line: resumeData.punch_line,
      };
      const { data } = await customFetch.post("/student/resume/ai-summaries", payload);
      setAiSummaries(data.summaries || []);
      toast.success("✨ AI Summaries generated successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to generate AI summaries.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Compile Resume Template with Student Data
  const handleCompileResume = async () => {
    setIsCompiling(true);
    try {
      // Autosave current progress first
      const savedResume = await handleSave(true);
      if (!savedResume) return;

      const { data } = await customFetch.post("/cv-templates/compile");
      setResumeData(data.resume);
      toast.success("✨ CV compiled successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Resume compilation failed.");
    } finally {
      setIsCompiling(false);
    }
  };

  // Add list item helpers
  const addEducation = () => {
    if (!eduInput.institution || !eduInput.degree) {
      toast.error("Institution and Degree fields are required!");
      return;
    }
    if (resumeData.education.length >= 2) {
      toast.error("Maximum 2 education entries are allowed to fit on one page!");
      return;
    }
    const updated = {
      ...resumeData,
      education: [...resumeData.education, eduInput],
    };
    setResumeData(updated);
    setEduInput({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
      score: "",
    });
  };

  const removeEducation = (index) => {
    const updated = {
      ...resumeData,
      education: resumeData.education.filter((_, i) => i !== index),
    };
    setResumeData(updated);
  };

  const addExperience = () => {
    const isFresher = expInput.company && expInput.company.toLowerCase().trim() === "fresher";
    if (!expInput.company || (!isFresher && !expInput.role)) {
      toast.error("Company and Role fields are required!");
      return;
    }
    if (resumeData.experience.length >= 2) {
      toast.error("Maximum 2 experience entries are allowed to fit on one page!");
      return;
    }
    const finalRole = expInput.role || (isFresher ? "Fresher" : "");
    const updated = {
      ...resumeData,
      experience: [...resumeData.experience, { ...expInput, role: finalRole }],
    };
    setResumeData(updated);
    setExpInput({
      company: "",
      role: "",
      description: "",
      startDate: "",
      endDate: "",
    });
  };

  const removeExperience = (index) => {
    const updated = {
      ...resumeData,
      experience: resumeData.experience.filter((_, i) => i !== index),
    };
    setResumeData(updated);
  };

  const addProject = () => {
    if (!projInput.title || !projInput.description) {
      toast.error("Project Title and Description are required!");
      return;
    }
    if (resumeData.projects.length >= 2) {
      toast.error("Maximum 2 project entries are allowed to fit on one page!");
      return;
    }
    const techArray = projInput.technologies
      ? projInput.technologies.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const updated = {
      ...resumeData,
      projects: [...resumeData.projects, { ...projInput, technologies: techArray }],
    };
    setResumeData(updated);
    setProjInput({
      title: "",
      description: "",
      technologies: "",
      link: "",
    });
  };

  const removeProject = (index) => {
    const updated = {
      ...resumeData,
      projects: resumeData.projects.filter((_, i) => i !== index),
    };
    setResumeData(updated);
  };

  // Tag helper functions
  const addSkill = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      if (resumeData.skills.length >= 5) {
        toast.error("Maximum 5 skills are allowed to fit on one page!");
        return;
      }
      if (tempSkill.trim() && !resumeData.skills.includes(tempSkill.trim())) {
        setResumeData({
          ...resumeData,
          skills: [...resumeData.skills, tempSkill.trim()],
        });
        setTempSkill("");
      }
    }
  };

  const removeSkill = (skill) => {
    setResumeData({
      ...resumeData,
      skills: resumeData.skills.filter((s) => s !== skill),
    });
  };

  const addCert = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      if (resumeData.certifications.length >= 3) {
        toast.error("Maximum 3 certifications are allowed to fit on one page!");
        return;
      }
      if (tempCert.trim() && !resumeData.certifications.includes(tempCert.trim())) {
        setResumeData({
          ...resumeData,
          certifications: [...resumeData.certifications, tempCert.trim()],
        });
        setTempCert("");
      }
    }
  };

  const removeCert = (cert) => {
    setResumeData({
      ...resumeData,
      certifications: resumeData.certifications.filter((c) => c !== cert),
    });
  };

  const addLang = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      if (resumeData.languages.length >= 3) {
        toast.error("Maximum 3 languages are allowed to fit on one page!");
        return;
      }
      if (tempLang.trim() && !resumeData.languages.includes(tempLang.trim())) {
        setResumeData({
          ...resumeData,
          languages: [...resumeData.languages, tempLang.trim()],
        });
        setTempLang("");
      }
    }
  };

  const removeLang = (lang) => {
    setResumeData({
      ...resumeData,
      languages: resumeData.languages.filter((l) => l !== lang),
    });
  };  // Direct print of the dynamic iframe content
  const handlePrint = () => {
    const iframe = document.getElementById("resume-iframe") || document.getElementById("resume-print-iframe");
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      toast.error("Please compile your CV first before exporting PDF!");
    }
  };



  if (checkingSubscription) {
    return <Loading />;
  }

  // Lock Screen Overlay if the student is unsubscribed
  if (!hasSubscription) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl border border-indigo-200 p-8 md:p-12 text-center shadow-lg relative overflow-hidden">
          <div className="w-20 h-20 bg-indigo-50 border border-indigo-150 rounded-3xl flex items-center justify-center text-[#3730a3] mx-auto mb-6 shadow-inner animate-bounce-slow">
            <FiLock className="w-10 h-10" />
          </div>

          <span className="bg-indigo-50 border border-indigo-100 text-[#3730a3] font-extrabold text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Premium Feature
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-4 max-w-lg mx-auto leading-tight">
            Unlock the Premium CV Builder
          </h1>
          <p className="text-slate-500 text-sm font-semibold mt-2.5 max-w-md mx-auto">
            Upgrade your membership to design, customize, and generate high-quality resumes tailored for placement success.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto mt-8 text-left">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-150 mt-0.5 shrink-0">
                <FiCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Template Builder</h4>
                <p className="text-slate-500 text-[11px] font-semibold mt-1">Our compiler replaces template placeholders and formats layouts cleanly.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-150 mt-0.5 shrink-0">
                <FiCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Curated Templates</h4>
                <p className="text-slate-500 text-[11px] font-semibold mt-1">Access custom CV layouts uploaded directly by college administrators.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-150 mt-0.5 shrink-0">
                <FiCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Direct Print & PDF Export</h4>
                <p className="text-slate-500 text-[11px] font-semibold mt-1">Print directly or save clean PDFs with custom print-media styling.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-155 mt-0.5 shrink-0">
                <FiCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Recruiter Visibility</h4>
                <p className="text-slate-500 text-[11px] font-semibold mt-1">Perfectly formatted resume details show up directly in corporate shortlists.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/dashboard/student/plans"
              className="bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-800 hover:to-indigo-700 text-white font-extrabold py-3 px-8 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-md"
            >
              View Subscription Plans <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedTemplate = templates.find(t => t._id === resumeData.selected_template_id);
  
  let liveCompiledHtml = "";
  if (selectedTemplate) {
    const compiled = compileHtmlTemplate(selectedTemplate.html_content, selectedTemplate.css_content || "", resumeData, user);
    liveCompiledHtml = compiled.compiledHtml;
  }

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background: white; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
        </style>
      </head>
      <body>
        ${liveCompiledHtml || "<div style='padding: 20px; font-family: sans-serif; text-align: center; color: #64748b;'>Select a template to begin previewing</div>"}
      </body>
    </html>
  `;

  // If no template is selected, show Template Gallery first!
  if (!resumeData.selected_template_id) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-6 text-left">
        <div className="space-y-1 pb-5 border-b border-slate-200">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiLayers className="text-[#3730a3] w-6 h-6" /> Select a Resume Template
          </h1>
          <p className="text-slate-450 text-xs font-semibold">
            Choose a foundation template. You can customize fonts, colors, and content once selected.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((t) => (
            <div
              key={t._id}
              onClick={() => changeTemplate(t._id)}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div className="h-56 w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden relative">
                {t.thumbnail ? (
                  <img src={t.thumbnail} alt={t.name} className="w-full h-full object-contain p-2 bg-slate-50 transition-transform duration-350 group-hover:scale-[1.02]" />
                ) : (
                  <div className="text-slate-350 flex flex-col items-center gap-1.5">
                    <FiFileText className="w-10 h-10 stroke-[1.5]" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">No Image Preview</span>
                  </div>
                )}
                
                {/* Use Button on Hover */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <span className="bg-white text-slate-800 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-md">
                    Use This Template
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h4 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug truncate group-hover:text-[#3730a3] transition-colors">
                  {t.name}
                </h4>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3">
              <FiFileText className="w-12 h-12 text-slate-350" />
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">No CV Templates Available</h4>
                <p className="text-xs text-slate-450 mt-1 max-w-xs leading-relaxed">
                  Please contact the administrator to upload resume templates before building your CV.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 relative text-left animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FiAward className="text-[#3730a3] w-6 h-6" /> CV Builder
          </h1>
          <p className="text-slate-450 text-xs font-semibold">
            Input details, choose layout configurations, and compile your custom template instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="md:hidden flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all"
          >
            {showPreview ? <><FiEdit className="w-3.5 h-3.5" /> Edit Details</> : <><FiEye className="w-3.5 h-3.5" /> View Resume</>}
          </button>

          <button
            type="button"
            onClick={() => changeTemplate("")}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-2.5 px-5 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-97 shadow-xs"
          >
            <FiLayers className="w-3.5 h-3.5" /> Change Template
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-2.5 px-5 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-97 shadow-xs disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Progress"}
          </button>

          <RefreshButton />
          
          {resumeData.ai_compiled_html && (
            <button
              onClick={handlePrint}
              className="bg-gradient-to-r from-[#3730a3] to-indigo-600 hover:opacity-95 text-white font-extrabold py-2.5 px-5 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-97 shadow-sm"
            >
              <FiPrinter className="w-3.5 h-3.5" /> Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Form Panel */}
        <div className={`md:col-span-6 lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 no-print ${showPreview ? "hidden md:block" : "block"}`}>
          {/* Main Editor Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 mb-2">
            <button
              type="button"
              onClick={() => setEditorMode("content")}
              className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                editorMode === "content" ? "bg-white text-[#3730a3] shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FiEdit className="w-3.5 h-3.5" /> Content
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("design")}
              className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                editorMode === "design" ? "bg-white text-[#3730a3] shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FiLayers className="w-3.5 h-3.5" /> Design
            </button>
          </div>

          {editorMode === "content" && (
            <>
              {/* Form Tabs Selector */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex border border-slate-200/50 scrollbar-none gap-2 text-xs font-black overflow-x-auto">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap text-[11px] font-black flex items-center gap-1.5 border border-transparent ${
                    activeTab === "profile" ? "bg-white text-[#3730a3] shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                  }`}
                >
                  <FiUser className="w-3.5 h-3.5" /> Profile
                </button>
                <button
                  onClick={() => setActiveTab("education")}
                  className={`px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap text-[11px] font-black flex items-center gap-1.5 border border-transparent ${
                    activeTab === "education" ? "bg-white text-[#3730a3] shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                  }`}
                >
                  <FiBookOpen className="w-3.5 h-3.5" /> Education
                </button>
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap text-[11px] font-black flex items-center gap-1.5 border border-transparent ${
                    activeTab === "projects" ? "bg-white text-[#3730a3] shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                  }`}
                >
                  <FiBriefcase className="w-3.5 h-3.5" /> Experience
                </button>
                <button
                  onClick={() => setActiveTab("skills")}
                  className={`px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap text-[11px] font-black flex items-center gap-1.5 border border-transparent ${
                    activeTab === "skills" ? "bg-white text-[#3730a3] shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                  }`}
                >
                  <FiCpu className="w-3.5 h-3.5" /> Skills
                </button>
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap text-[11px] font-black flex items-center gap-1.5 border border-transparent ${
                    activeTab === "summary" ? "bg-white text-[#3730a3] shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                  }`}
                >
                  <FiZap className="w-3.5 h-3.5" /> AI Summary
                </button>
              </div>

              {/* Tab 1: Profile & Social Links */}
              {activeTab === "profile" && (
                <div className="space-y-4 text-left">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Profile & Social Details</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Punch line / Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. MERN Stack Developer | Competitive Programmer"
                      value={resumeData.punch_line}
                      onChange={(e) => setResumeData({ ...resumeData, punch_line: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#3730a3] rounded-xl text-xs font-bold text-slate-850 transition focus:ring-2 focus:ring-[#3730a3]/10 focus:outline-none"
                    />
                  </div>





                  <div className="p-5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs space-y-1.5 leading-relaxed">
                    <p className="font-extrabold text-slate-700 flex items-center gap-1.5"><FiUser className="text-[#3730a3]" /> Pre-populated Contact Details</p>
                    <p className="text-slate-550 font-semibold mt-1">Name: <span className="font-black text-slate-700">{user?.student_name}</span></p>
                    <p className="text-slate-550 font-semibold">Email: <span className="font-black text-slate-700">{user?.student_email}</span></p>
                    <p className="text-slate-550 font-semibold">Contact: <span className="font-black text-slate-700">{user?.student_contact || "Not Provided"}</span></p>
                  </div>
                </div>
              )}

              {/* Tab 2: Education List */}
              {activeTab === "education" && (
                <div className="space-y-6 text-left">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Education History</h3>
                    
                    {/* List of existing educations */}
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                      {resumeData.education.length === 0 ? (
                        <p className="text-xs italic text-slate-450 border border-dashed border-slate-200 p-4 rounded-xl">No education entries added yet. Fill the form below to add entries.</p>
                      ) : (
                        resumeData.education.map((edu, idx) => (
                          <div key={idx} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 transition group">
                            <div className="min-w-0 space-y-1 flex-1">
                              <h4 className="font-extrabold text-slate-800 text-xs truncate leading-snug">{edu.institution}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500">
                                <span className="bg-indigo-50 text-[#3730a3] px-2 py-0.5 rounded-md border border-indigo-100 font-bold">{edu.degree} in {edu.fieldOfStudy}</span>
                                <span>•</span>
                                <span className="shrink-0">{edu.startYear} - {edu.endYear}</span>
                                {edu.score && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-655 font-extrabold shrink-0">Score: {edu.score}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEducation(idx)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition active:scale-95 shrink-0"
                              title="Delete entry"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add new education form */}
                    <div className="bg-slate-50/30 border border-slate-200 rounded-3xl p-5 space-y-4">
                      <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5"><FiBookOpen className="text-slate-400" /> Add Education Entry</h4>
                      <div className="grid grid-cols-2 gap-3.5">
                        <input
                          type="text"
                          placeholder="Degree (e.g. B.Tech)"
                          value={eduInput.degree}
                          onChange={(e) => setEduInput({ ...eduInput, degree: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                        <input
                          type="text"
                          placeholder="Field of Study (e.g. CSE)"
                          value={eduInput.fieldOfStudy}
                          onChange={(e) => setEduInput({ ...eduInput, fieldOfStudy: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Institution / University Name"
                        value={eduInput.institution}
                        onChange={(e) => setEduInput({ ...eduInput, institution: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition"
                      />
                      <div className="grid grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          placeholder="Start Year"
                          value={eduInput.startYear}
                          onChange={(e) => setEduInput({ ...eduInput, startYear: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                        <input
                          type="text"
                          placeholder="End Year"
                          value={eduInput.endYear}
                          onChange={(e) => setEduInput({ ...eduInput, endYear: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                        <input
                          type="text"
                          placeholder="Score (e.g. 9.1 CGPA)"
                          value={eduInput.score}
                          onChange={(e) => setEduInput({ ...eduInput, score: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addEducation}
                        disabled={resumeData.education.length >= 2}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-250 hover:border-slate-355 text-slate-750 font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-97 shadow-xs disabled:opacity-50"
                      >
                        <FiPlus /> {resumeData.education.length >= 2 ? "Education Limit Reached" : "Add Education"}
                      </button>
                      {resumeData.education.length >= 2 && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-1.5 text-center">Maximum 2 education entries allowed to fit on one page.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Projects & Work Experience */}
              {activeTab === "projects" && (
                <div className="space-y-6 text-left">
                  {/* Projects Section */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Projects Details</h3>
                    
                    {/* List of existing projects */}
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                      {resumeData.projects.length === 0 ? (
                        <p className="text-xs italic text-slate-455 border border-dashed border-slate-200 p-4 rounded-xl">No project entries added yet. Add projects below.</p>
                      ) : (
                        resumeData.projects.map((proj, idx) => (
                          <div key={idx} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 transition group">
                            <div className="min-w-0 space-y-1 flex-1">
                              <div className="flex items-center gap-2 justify-between">
                                <h4 className="font-extrabold text-slate-800 text-xs truncate leading-snug">{proj.title}</h4>
                                {proj.link && (
                                  <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] text-[#3730a3] font-bold hover:underline flex items-center gap-0.5 shrink-0">
                                    <FiGlobe className="w-3 h-3" /> Link
                                  </a>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold line-clamp-1">{proj.description}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {proj.technologies?.map((tech, tIdx) => (
                                  <span key={tIdx} className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[9px] font-bold border border-slate-200/50">{tech}</span>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeProject(idx)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition active:scale-95 shrink-0 ml-2"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add new project form */}
                    <div className="bg-slate-50/30 border border-slate-200 rounded-3xl p-5 space-y-4">
                      <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5"><FiCpu className="text-slate-400" /> Add Project Entry</h4>
                      <div className="grid grid-cols-2 gap-3.5">
                        <input
                          type="text"
                          placeholder="Project Title"
                          value={projInput.title}
                          onChange={(e) => setProjInput({ ...projInput, title: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                        <input
                          type="text"
                          placeholder="Technologies (e.g. React, MongoDB)"
                          value={projInput.technologies}
                          onChange={(e) => setProjInput({ ...projInput, technologies: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                      </div>
                      <input
                        type="url"
                        placeholder="Project URL (e.g. Github Repo, Live URL)"
                        value={projInput.link}
                        onChange={(e) => setProjInput({ ...projInput, link: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition"
                      />
                      <div className="space-y-1">
                        <textarea
                          placeholder="Short Description of key achievements/role"
                          rows="2.5"
                          maxLength={200}
                          value={projInput.description}
                          onChange={(e) => setProjInput({ ...projInput, description: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3730a3] bg-white transition resize-none"
                        />
                        <div className="text-right text-[9px] font-bold text-slate-450">
                          {(projInput.description || "").length}/200 chars
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addProject}
                        disabled={resumeData.projects.length >= 2}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-255 hover:border-slate-355 text-slate-750 font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-97 shadow-xs disabled:opacity-50"
                      >
                        <FiPlus /> {resumeData.projects.length >= 2 ? "Project Limit Reached" : "Add Project"}
                      </button>
                      {resumeData.projects.length >= 2 && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-1.5 text-center">Maximum 2 projects allowed to fit on one page.</p>
                      )}
                    </div>
                  </div>

                  <hr className="border-slate-150" />

                  {/* Experience / Internship Section */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Work / Intern Experience</h3>
                    
                    {/* List of existing experiences */}
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                      {resumeData.experience.length === 0 ? (
                        <p className="text-xs italic text-slate-455 border border-dashed border-slate-200 p-4 rounded-xl">No internship entries added yet.</p>
                      ) : (
                        resumeData.experience.map((exp, idx) => (
                          <div key={idx} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 transition group">
                            <div className="min-w-0 space-y-1 flex-1">
                              <h4 className="font-extrabold text-slate-800 text-xs truncate leading-snug">{exp.company}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500">
                                <span className="text-[#3730a3] font-bold">{exp.role}</span>
                                <span>•</span>
                                <span className="shrink-0">{exp.startDate} - {exp.endDate}</span>
                              </div>
                              <p className="text-[10px] text-slate-450 font-semibold line-clamp-1">{exp.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExperience(idx)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition active:scale-95 shrink-0 ml-2"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add new experience form */}
                    <div className="bg-slate-50/30 border border-slate-200 rounded-3xl p-5 space-y-4">
                      <h4 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5"><FiBriefcase className="text-slate-400" /> Add Internship / Work Entry</h4>
                      <div className="grid grid-cols-2 gap-3.5">
                        <input
                          type="text"
                          placeholder="Company Name"
                          value={expInput.company}
                          onChange={(e) => setExpInput({ ...expInput, company: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                        <input
                          type="text"
                          placeholder="Role (e.g. Backend Intern)"
                          value={expInput.role}
                          onChange={(e) => setExpInput({ ...expInput, role: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <input
                          type="text"
                          placeholder="Start Month/Year (e.g. Jan 2026)"
                          value={expInput.startDate}
                          onChange={(e) => setExpInput({ ...expInput, startDate: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                        <input
                          type="text"
                          placeholder="End Month/Year (or Present)"
                          value={expInput.endDate}
                          onChange={(e) => setExpInput({ ...expInput, endDate: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-855 focus:outline-none focus:border-[#3730a3] bg-white transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <textarea
                          placeholder="Describe your primary learnings or project scope"
                          rows="2.5"
                          maxLength={200}
                          value={expInput.description}
                          onChange={(e) => setExpInput({ ...expInput, description: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-805 focus:outline-none focus:border-[#3730a3] bg-white transition resize-none"
                        />
                        <div className="text-right text-[9px] font-bold text-slate-450">
                          {(expInput.description || "").length}/200 chars
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addExperience}
                        disabled={resumeData.experience.length >= 2}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-250 hover:border-slate-355 text-slate-750 font-extrabold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-97 shadow-xs disabled:opacity-50"
                      >
                        <FiPlus /> {resumeData.experience.length >= 2 ? "Experience Limit Reached" : "Add Work Experience"}
                      </button>
                      {resumeData.experience.length >= 2 && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-1.5 text-center">Maximum 2 work experiences allowed to fit on one page.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Skills, Certifications, Languages Tag Entry */}
              {activeTab === "skills" && (
                <div className="space-y-5 text-left">
                  {/* Skills Tags */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-505 uppercase tracking-wide block">Skills List</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={resumeData.skills.length >= 5 ? "Skills limit reached" : "Press enter or click Add (e.g. JavaScript)"}
                        disabled={resumeData.skills.length >= 5}
                        value={tempSkill}
                        onChange={(e) => setTempSkill(e.target.value)}
                        onKeyDown={addSkill}
                        className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#3730a3] rounded-xl text-xs font-bold text-slate-850 transition focus:ring-2 focus:ring-[#3730a3]/10 focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        disabled={resumeData.skills.length >= 5}
                        className="bg-[#3730a3] hover:opacity-95 text-white font-extrabold px-5 rounded-xl text-[10px] uppercase shrink-0 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    {resumeData.skills.length >= 5 && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">Maximum 5 skills allowed to fit on one page.</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {resumeData.skills.length === 0 ? (
                        <span className="text-xs italic text-slate-400">No skills added yet.</span>
                      ) : (
                        resumeData.skills.map((skill, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3.5 py-1 rounded-xl text-[11px] font-extrabold border border-indigo-100/60 shadow-xs max-w-full shrink-0">
                            <span className="truncate">{skill}</span>
                            <button type="button" onClick={() => removeSkill(skill)} className="hover:text-rose-600 font-bold ml-1 text-xs shrink-0">×</button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Certifications Tags */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-505 uppercase tracking-wide block">Certifications</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={resumeData.certifications.length >= 3 ? "Certifications limit reached" : "e.g. AWS Certified Practitioner"}
                        disabled={resumeData.certifications.length >= 3}
                        value={tempCert}
                        onChange={(e) => setTempCert(e.target.value)}
                        onKeyDown={addCert}
                        className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#3730a3] rounded-xl text-xs font-bold text-slate-850 transition focus:ring-2 focus:ring-[#3730a3]/10 focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={addCert}
                        disabled={resumeData.certifications.length >= 3}
                        className="bg-[#3730a3] hover:opacity-95 text-white font-extrabold px-5 rounded-xl text-[10px] uppercase shrink-0 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    {resumeData.certifications.length >= 3 && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">Maximum 3 certifications allowed to fit on one page.</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {resumeData.certifications.length === 0 ? (
                        <span className="text-xs italic text-slate-400">No certifications listed yet.</span>
                      ) : (
                        resumeData.certifications.map((cert, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3.5 py-1 rounded-xl text-[11px] font-extrabold border border-indigo-100/60 shadow-xs max-w-full shrink-0">
                            <span className="truncate">{cert}</span>
                            <button type="button" onClick={() => removeCert(cert)} className="hover:text-rose-600 font-bold ml-1 text-xs shrink-0">×</button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Languages Tags */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-550 uppercase tracking-wide block">Spoken Languages</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={resumeData.languages.length >= 3 ? "Languages limit reached" : "e.g. English, Spanish"}
                        disabled={resumeData.languages.length >= 3}
                        value={tempLang}
                        onChange={(e) => setTempLang(e.target.value)}
                        onKeyDown={addLang}
                        className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#3730a3] rounded-xl text-xs font-bold text-slate-850 transition focus:ring-2 focus:ring-[#3730a3]/10 focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={addLang}
                        disabled={resumeData.languages.length >= 3}
                        className="bg-[#3730a3] hover:opacity-95 text-white font-extrabold px-5 rounded-xl text-[10px] uppercase shrink-0 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    {resumeData.languages.length >= 3 && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">Maximum 3 languages allowed to fit on one page.</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {resumeData.languages.length === 0 ? (
                        <span className="text-xs italic text-slate-400">No languages listed yet.</span>
                      ) : (
                        resumeData.languages.map((lang, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3.5 py-1 rounded-xl text-[11px] font-extrabold border border-indigo-100/60 shadow-xs max-w-full shrink-0">
                            <span className="truncate">{lang}</span>
                            <button type="button" onClick={() => removeLang(lang)} className="hover:text-rose-600 font-bold ml-1 text-xs shrink-0">×</button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: AI Summary */}
              {activeTab === "summary" && (
                <div className="space-y-4 text-left animate-fade-in">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Professional Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Write or Generate Summary</label>
                      <button
                        type="button"
                        onClick={handleGenerateAiSummaries}
                        disabled={isGeneratingSummary}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold py-1 px-3 rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                      >
                        {isGeneratingSummary ? (
                          <>
                            <span className="animate-spin inline-block w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                            Generating...
                          </>
                        ) : (
                          "✨ Ask AI to Write"
                        )}
                      </button>
                    </div>

                    {/* AI Generated Summaries List - Always Visible */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <FiZap className="text-[#3730a3]" /> AI Generated Summary Options (Select to apply)
                      </span>
                      <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
                        {aiSummaries && aiSummaries.length > 0 ? (
                          aiSummaries.map((summary, index) => {
                            const tones = [
                              "Classic & Professional",
                              "Modern & Tech-focused",
                              "Creative & High-energy",
                              "Minimalist & Direct",
                              "Results-oriented / Metric-driven"
                            ];
                            const isSelected = resumeData.chosen_summary === summary;
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setResumeData({ ...resumeData, chosen_summary: summary });
                                  toast.success(`Applied ${tones[index]} summary!`);
                                }}
                                className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                                  isSelected
                                    ? "border-[#3730a3] bg-indigo-50/50 text-[#3730a3] ring-1 ring-[#3730a3]/20"
                                    : "border-slate-200 bg-white hover:border-slate-350 text-slate-700 hover:bg-slate-50/50"
                                }`}
                              >
                                <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? "text-[#3730a3]" : "text-slate-400"}`}>
                                  Option {index + 1}: {tones[index]} {isSelected && "✓ (Active)"}
                                </span>
                                <p className="text-[11px] leading-relaxed font-semibold">
                                  {summary}
                                </p>
                              </button>
                            );
                          })
                        ) : (
                          [
                            "Classic & Professional",
                            "Modern & Tech-focused",
                            "Creative & High-energy",
                            "Minimalist & Direct",
                            "Results-oriented / Metric-driven"
                          ].map((tone, index) => (
                            <div
                              key={index}
                              className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/30 flex flex-col gap-1 opacity-70"
                            >
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                Option {index + 1}: {tone} (Not Generated)
                              </span>
                              <p className="text-[10px] italic text-slate-400">
                                Please click "✨ Ask AI to Write" above to generate this option.
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Customize Active Summary</label>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                          {(resumeData.chosen_summary || "").length}/300 chars
                        </span>
                      </div>
                      <textarea
                        placeholder="Write a brief overview of your professional background, key skills, and career objectives, or select one of the AI options above to populate..."
                        rows="4.5"
                        maxLength={300}
                        value={resumeData.chosen_summary}
                        onChange={(e) => setResumeData({ ...resumeData, chosen_summary: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-[#3730a3] rounded-xl text-xs font-bold text-slate-850 transition focus:ring-2 focus:ring-[#3730a3]/10 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="p-5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs space-y-2 leading-relaxed">
                    <p className="font-extrabold text-slate-700 flex items-center gap-1.5"><FiZap className="text-[#3730a3]" /> How does the AI writer work?</p>
                    <p className="text-slate-550 font-semibold">
                      The AI reads your current filled details (Skills, Projects, Education history, and Job Title) to construct a professional, industry-tailored summary. Make sure you fill those tabs before clicking the AI button!
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {editorMode === "design" && (
            <div className="space-y-6 text-left animate-fade-in">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Design Customization</h3>
              
              {/* Template Theme Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Resume Layout Template</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {templates.map((t) => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => changeTemplate(t._id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-between gap-1 truncate ${
                        resumeData.selected_template_id === t._id
                          ? "border-[#3730a3] bg-indigo-50/50 text-[#3730a3]"
                          : "border-slate-200 bg-white hover:border-slate-350 text-slate-700"
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                      {resumeData.selected_template_id === t._id && <FiCheck className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography / Font Family */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Typography / Font Family</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Inter", "Outfit", "Playfair Display", "Roboto"].map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => setResumeData({ ...resumeData, font_family: font })}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                        resumeData.font_family === font
                          ? "border-[#3730a3] bg-indigo-50/50 text-[#3730a3]"
                          : "border-slate-200 bg-white hover:border-slate-350 text-slate-700"
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Theme */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Color Theme / Accent Color</label>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { name: "Indigo", value: "#3730a3" },
                    { name: "Emerald", value: "#059669" },
                    { name: "Charcoal", value: "#334155" },
                    { name: "Slate Blue", value: "#1e3a8a" },
                    { name: "Crimson", value: "#be123c" },
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setResumeData({ ...resumeData, color_theme: color.value })}
                      style={{ backgroundColor: color.value }}
                      className={`w-7 h-7 rounded-full border-2 transition-all relative ${
                        resumeData.color_theme === color.value
                          ? "border-slate-900 ring-2 ring-indigo-500/20 scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      title={color.name}
                    >
                      {resumeData.color_theme === color.value && (
                        <FiCheck className="w-3.5 h-3.5 text-white absolute inset-0 m-auto stroke-[3.5]" />
                      )}
                    </button>
                  ))}
                  
                  {/* Custom color picker */}
                  <div className="flex items-center gap-2 ml-2 border border-slate-200 rounded-xl p-1 px-2.5 bg-slate-50/50">
                    <input
                      type="color"
                      value={resumeData.color_theme}
                      onChange={(e) => setResumeData({ ...resumeData, color_theme: e.target.value })}
                      className="w-6 h-6 rounded border border-slate-200 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{resumeData.color_theme}</span>
                  </div>
                </div>
              </div>

              {/* Layout Columns */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Columns / Layout Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "single", label: "Single Col" },
                    { id: "two_column_left", label: "Sidebar Left" },
                    { id: "two_column_right", label: "Sidebar Right" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setResumeData({ ...resumeData, layout_columns: mode.id })}
                      className={`py-2.5 px-2.5 rounded-xl border text-[11px] font-bold transition-all text-center truncate ${
                        resumeData.layout_columns === mode.id
                          ? "border-[#3730a3] bg-indigo-50/50 text-[#3730a3]"
                          : "border-slate-200 bg-white hover:border-slate-350 text-slate-700"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Spacing & Margin */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Margins & Spacing</label>
                <div className="grid grid-cols-3 gap-2">
                  {["small", "medium", "large"].map((margin) => (
                    <button
                      key={margin}
                      type="button"
                      onClick={() => setResumeData({ ...resumeData, page_margin: margin })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center capitalize ${
                        resumeData.page_margin === margin
                          ? "border-[#3730a3] bg-indigo-50/50 text-[#3730a3]"
                          : "border-slate-200 bg-white hover:border-slate-350 text-slate-700"
                      }`}
                    >
                      {margin}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] leading-relaxed text-slate-500 font-semibold space-y-1">
                <p className="font-extrabold text-slate-700 flex items-center gap-1.5"><FiLayers className="text-[#3730a3]" /> Styling Tips</p>
                <p>Toggle typography, color accents, layout columns, and margins to preview in real-time. When ready, click <strong>"Compile CV Layout"</strong> to save the final compiled HTML version.</p>
              </div>
            </div>
          )}
        </div>
             {/* Right Preview Panel */}
        <div className={`md:col-span-6 lg:col-span-7 space-y-6 ${showPreview ? "block" : "hidden md:block"}`}>
          {/* Action Row */}
          <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex items-center justify-between no-print">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FiEye className="text-[#3730a3]" /> Live Preview
            </h3>
            <button
              type="button"
              onClick={handleCompileResume}
              disabled={isCompiling}
              className="bg-gradient-to-r from-indigo-700 to-indigo-600 hover:opacity-95 text-white font-extrabold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 active:scale-97 shadow-xs disabled:opacity-50"
            >
              {isCompiling ? "Saving..." : "Compile & Save to Profile"}
            </button>
          </div>

          {/* Iframe Preview Canvas */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden relative h-[780px] flex flex-col bg-slate-100/50">
            <div className="px-5 py-3 border-b border-slate-150 flex items-center justify-between bg-slate-50/80 no-print">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                A4 Live Document
              </span>
              <button
                onClick={() => setShowFullscreenPreview(true)}
                className="text-slate-500 hover:text-slate-800 transition p-1"
                title="Fullscreen Preview"
              >
                <FiEye className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 bg-white overflow-hidden relative">
              <iframe
                id="resume-iframe"
                srcDoc={srcDoc}
                title="Live Compiled Resume"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {showFullscreenPreview && (
        <div className="fixed inset-0 bg-black/5 z-50 flex items-center justify-center p-4 md:p-6 no-print">
          <div className="bg-white w-full max-w-5xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FiFileText className="text-[#3730a3]" /> Fullscreen CV Preview
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="bg-[#3730a3] hover:bg-indigo-800 text-white font-extrabold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-97 shadow-sm"
                >
                  <FiPrinter className="w-3.5 h-3.5" /> Download PDF
                </button>

                <button
                  onClick={() => setShowFullscreenPreview(false)}
                  className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-850 rounded-xl transition active:scale-95"
                  title="Close Preview"
                >
                  <FiX className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
            {/* Modal Body */}
            <div className="flex-1 bg-white overflow-hidden relative">
              <iframe
                id="resume-iframe"
                srcDoc={srcDoc}
                title="Fullscreen Compiled Resume"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print IFrame for background PDF download when modal is closed */}
      {resumeData.ai_compiled_html && (
        <iframe
          id="resume-print-iframe"
          srcDoc={srcDoc}
          title="Print Preview"
          style={{ display: "none" }}
        />
      )}


    </div>
  );
};

const LocalResumePreview = ({ data, user }) => {
  const {
    punch_line,
    linkedin,
    github,
    portfolio,
    education = [],
    experience = [],
    projects = [],
    skills = [],
    certifications = [],
    languages = [],
    chosen_summary,
    font_family = "Inter",
    color_theme = "#3730a3",
    layout_columns = "two_column_left",
    page_margin = "medium",
  } = data;

  // Spacing map
  const spacingClass = {
    small: { padding: "p-4", gap: "space-y-3", itemGap: "space-y-1.5" },
    medium: { padding: "p-8", gap: "space-y-6", itemGap: "space-y-3" },
    large: { padding: "p-12", gap: "space-y-8", itemGap: "space-y-4.5" },
  }[page_margin] || { padding: "p-8", gap: "space-y-6", itemGap: "space-y-3" };

  // Font map
  const fontStyle = {
    Inter: { fontFamily: "'Inter', sans-serif" },
    Outfit: { fontFamily: "'Outfit', sans-serif" },
    "Playfair Display": { fontFamily: "'Playfair Display', serif" },
    Roboto: { fontFamily: "'Roboto', sans-serif" },
  }[font_family] || { fontFamily: "'Inter', sans-serif" };

  const accentText = { color: color_theme };
  const accentBg = { backgroundColor: `${color_theme}0c`, color: color_theme, borderColor: `${color_theme}25` }; // low opacity bg
  const accentBorder = { borderColor: `${color_theme}40` };

  // Contact list
  const contactDetails = (
    <div className="space-y-2 text-[11px] text-slate-600">
      <div className="flex items-center gap-2">
        <FiMail className="w-3.5 h-3.5 shrink-0" style={accentText} />
        <span className="truncate" title={user?.student_email}>{user?.student_email || "email@example.com"}</span>
      </div>
      {user?.student_contact && (
        <div className="flex items-center gap-2">
          <FiPhone className="w-3.5 h-3.5 shrink-0" style={accentText} />
          <span>{user?.student_contact}</span>
        </div>
      )}
    </div>
  );

  // Render sub-components
  const renderHeader = () => (
    <div className="border-b pb-4 text-left" style={accentBorder}>
      <h1 className="text-xl font-extrabold tracking-tight text-slate-800 uppercase">{user?.student_name || "Your Name"}</h1>
      {punch_line && <p className="text-xs font-bold uppercase mt-1 tracking-wider" style={accentText}>{punch_line}</p>}
    </div>
  );

  const renderSummary = () => {
    if (!chosen_summary) return null;
    return (
      <div className="text-left">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Profile Summary</h3>
        <p className="text-[11px] leading-relaxed text-slate-600">{chosen_summary}</p>
      </div>
    );
  };

  const renderEducation = () => {
    if (education.length === 0) return null;
    return (
      <div className="text-left">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Education</h3>
        <div className={spacingClass.itemGap}>
          {education.map((edu, idx) => (
            <div key={idx} className="relative pl-3 border-l-2" style={accentBorder}>
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-extrabold text-[11px] text-slate-800 leading-tight">{edu.institution}</h4>
                <span className="text-[9px] text-slate-400 font-bold shrink-0">{edu.startYear} - {edu.endYear}</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</p>
              {edu.score && <p className="text-[9px] font-bold text-slate-450 mt-0.5">Score: {edu.score}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExperience = () => {
    if (experience.length === 0) return null;
    return (
      <div className="text-left">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Experience</h3>
        <div className={spacingClass.itemGap}>
          {experience.map((exp, idx) => (
            <div key={idx} className="relative pl-3 border-l-2" style={accentBorder}>
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-extrabold text-[11px] text-slate-800 leading-tight">{exp.company}</h4>
                <span className="text-[9px] text-slate-400 font-bold shrink-0">{exp.startDate} - {exp.endDate}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={accentText}>{exp.role}</p>
              {exp.description && <p className="text-[10px] text-slate-500 leading-relaxed mt-1">{exp.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjects = () => {
    if (projects.length === 0) return null;
    return (
      <div className="text-left">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Projects</h3>
        <div className={spacingClass.itemGap}>
          {projects.map((proj, idx) => (
            <div key={idx} className="relative pl-3 border-l-2" style={accentBorder}>
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-extrabold text-[11px] text-slate-800 leading-tight">{proj.title}</h4>
                {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" className="text-[9px] hover:underline shrink-0" style={accentText}>Link</a>}
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">{proj.description}</p>
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {proj.technologies.map((tech, tIdx) => (
                    <span key={tIdx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-extrabold">{tech}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSkills = () => {
    if (skills.length === 0) return null;
    return (
      <div className="text-left">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Skills</h3>
        <div className="flex flex-wrap gap-1">
          {skills.map((skill, idx) => (
            <span key={idx} className="border px-2 py-0.5 rounded text-[9px] font-bold" style={accentBg}>{skill}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderLanguages = () => {
    if (languages.length === 0) return null;
    return (
      <div className="text-left">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Languages</h3>
        <div className="flex flex-wrap gap-1">
          {languages.map((lang, idx) => (
            <span key={idx} className="border px-2 py-0.5 rounded text-[9px] font-bold" style={accentBg}>{lang}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderCertifications = () => {
    if (certifications.length === 0) return null;
    return (
      <div className="text-left">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Certifications</h3>
        <div className="space-y-1">
          {certifications.map((cert, idx) => (
            <div key={idx} className="text-[10px] font-semibold text-slate-600 flex items-start gap-1">
              <span style={accentText}>•</span> <span className="leading-snug">{cert}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`w-full min-h-[500px] bg-white text-slate-800 shadow-inner border border-slate-100 rounded-2xl text-left select-none pointer-events-none ${spacingClass.padding} ${spacingClass.gap}`} 
      style={fontStyle}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap');
      `}</style>
      
      {layout_columns === "single" ? (
        <div className="space-y-5">
          {renderHeader()}
          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
            {contactDetails}
          </div>
          {renderSummary()}
          {renderExperience()}
          {renderProjects()}
          {renderEducation()}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            {renderSkills()}
            {renderLanguages()}
          </div>
          {renderCertifications()}
        </div>
      ) : (
        <div className="space-y-5">
          {renderHeader()}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className={`md:col-span-4 space-y-5 ${layout_columns === "two_column_left" ? "order-1" : "order-2"}`}>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Contact Info</h3>
                {contactDetails}
              </div>
              {renderEducation()}
              {renderSkills()}
              {renderLanguages()}
              {renderCertifications()}
            </div>
            <div className={`md:col-span-8 space-y-5 ${layout_columns === "two_column_left" ? "order-2" : "order-1"}`}>
              {renderSummary()}
              {renderExperience()}
              {renderProjects()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
