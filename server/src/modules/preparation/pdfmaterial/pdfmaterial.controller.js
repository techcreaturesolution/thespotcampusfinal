import PdfMaterial from "./pdfmaterial.model.js";
import StudentProgress from "../progress/studentprogress.model.js";
import { StatusCodes } from "http-status-codes";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

// Helper to parse page count from local PDF file binary stream
const getPdfPageCount = async (filePath) => {
  try {
    const data = await fs.readFile(filePath);
    const content = data.toString("binary");

    // Match "/Type /Pages /Count X" pattern
    const pagesCountRegex = /\/Type\s*\/Pages\s*\/Count\s+(\d+)/g;
    let match;
    let maxPages = 0;
    while ((match = pagesCountRegex.exec(content)) !== null) {
      const count = parseInt(match[1], 10);
      if (count > maxPages) maxPages = count;
    }

    if (maxPages > 0) return maxPages;

    // Match "/Count X" general pattern
    const countRegex = /\/Count\s+(\d+)/g;
    while ((match = countRegex.exec(content)) !== null) {
      const count = parseInt(match[1], 10);
      if (count > maxPages) maxPages = count;
    }

    if (maxPages > 0) return maxPages;

    // Fallback: count individual page objects "/Type /Page"
    const pageMatches = content.match(/\/Type\s*\/Page\b/g);
    return pageMatches ? pageMatches.length : 0;
  } catch (error) {
    console.error("Error reading PDF page count:", error);
    return 0;
  }
};

// Admin: Upload PDF
export const createPdfMaterial = async (req, res) => {
  const { title, description, category, subject_id, tags, total_pages } = req.body;
  let file_url = req.body.file_url || "";
  let file_public_id = "";
  let file_size_mb = 0;
  let pages = parseInt(total_pages || "0", 10);

  if (req.file) {
    try {
      // Calculate file size in MB
      const stats = await fs.stat(req.file.path);
      file_size_mb = Math.round((stats.size / (1024 * 1024)) * 100) / 100;

      // Extract PDF page count automatically
      pages = await getPdfPageCount(req.file.path);

      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        resource_type: "raw",
        folder: "preparation_pdfs",
      });
      file_url = result.secure_url;
      file_public_id = result.public_id;
    } finally {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error("Failed to delete local temp PDF file:", err);
      }
    }
  }

  const pdf = await PdfMaterial.create({
    title,
    description,
    category,
    subject_id: subject_id || null,
    file_url,
    file_public_id,
    tags: tags ? (typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags) : [],
    total_pages: pages,
    file_size_mb,
  });
  res.status(StatusCodes.CREATED).json({ pdf });
};

// Admin: Get all PDFs
export const getAllPdfMaterials = async (req, res) => {
  const { category, search } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search, $options: "i" };
  const pdfs = await PdfMaterial.find(filter).populate("subject_id", "name").sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json({ pdfs });
};

// Admin: Update PDF
export const updatePdfMaterial = async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const existingPdf = await PdfMaterial.findById(id);
  if (!existingPdf) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "PDF not found" });
  }

  if (req.file) {
    try {
      // Calculate file size in MB
      const stats = await fs.stat(req.file.path);
      updateData.file_size_mb = Math.round((stats.size / (1024 * 1024)) * 100) / 100;

      // Extract new page count automatically
      updateData.total_pages = await getPdfPageCount(req.file.path);

      // Upload new file to Cloudinary
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        resource_type: "raw",
        folder: "preparation_pdfs",
      });
      updateData.file_url = result.secure_url;
      updateData.file_public_id = result.public_id;

      // Delete the old file from Cloudinary (if exists)
      if (existingPdf.file_public_id) {
        try {
          await cloudinary.v2.uploader.destroy(existingPdf.file_public_id, { resource_type: "raw" });
        } catch (cloudinaryErr) {
          console.error("Failed to delete old PDF from Cloudinary:", cloudinaryErr);
        }
      }
    } catch (err) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message });
    } finally {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error("Failed to delete local temp PDF file:", err);
      }
    }
  }

  if (updateData.tags && typeof updateData.tags === "string") {
    updateData.tags = updateData.tags.split(",").map((t) => t.trim());
  }

  const pdf = await PdfMaterial.findByIdAndUpdate(id, updateData, { new: true }).populate("subject_id", "name");
  res.status(StatusCodes.OK).json({ pdf });
};

// Admin: Delete PDF
export const deletePdfMaterial = async (req, res) => {
  const pdf = await PdfMaterial.findByIdAndDelete(req.params.id);
  if (!pdf) return res.status(StatusCodes.NOT_FOUND).json({ msg: "PDF not found" });
  if (pdf.file_public_id) {
    try { await cloudinary.v2.uploader.destroy(pdf.file_public_id, { resource_type: "raw" }); } catch (e) {}
  }
  res.status(StatusCodes.OK).json({ msg: "PDF deleted" });
};

// Student: Get active PDFs
export const getActivePdfs = async (req, res) => {
  const { category, search, subject_id } = req.query;
  const filter = { is_active: true };
  if (category) filter.category = category;
  if (subject_id) filter.subject_id = subject_id;
  if (search) filter.title = { $regex: search, $options: "i" };
  const pdfs = await PdfMaterial.find(filter).populate("subject_id", "name").sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json({ pdfs });
};

// Student: Track reading progress
export const updateReadingProgress = async (req, res) => {
  const { pdf_id, last_page, total_pages } = req.body;
  const studentId = req.user.userId;
  let progress = await StudentProgress.findOne({ student_id: studentId });
  if (!progress) progress = await StudentProgress.create({ student_id: studentId });

  const existing = progress.reading_progress.find((r) => r.pdf_id?.toString() === pdf_id);
  if (existing) {
    existing.last_page = last_page;
    existing.total_pages = total_pages;
    existing.progress_percent = total_pages > 0 ? Math.round((last_page / total_pages) * 100) : 0;
  } else {
    progress.reading_progress.push({
      pdf_id,
      last_page,
      total_pages,
      progress_percent: total_pages > 0 ? Math.round((last_page / total_pages) * 100) : 0,
    });
  }
  await progress.save();
  await PdfMaterial.findByIdAndUpdate(pdf_id, { $inc: { view_count: 1 } });
  res.status(StatusCodes.OK).json({ msg: "Progress updated" });
};
