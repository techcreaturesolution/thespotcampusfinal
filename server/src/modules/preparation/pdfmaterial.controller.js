import PdfMaterial from "./pdfmaterial.model.js";
import StudentProgress from "./studentprogress.model.js";
import { StatusCodes } from "http-status-codes";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

// Admin: Upload PDF
export const createPdfMaterial = async (req, res) => {
  const { title, description, category, subject_id, tags, total_pages } = req.body;
  let file_url = req.body.file_url || "";
  let file_public_id = "";

  if (req.file) {
    try {
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
    total_pages: total_pages || 0,
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
  const pdf = await PdfMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!pdf) return res.status(StatusCodes.NOT_FOUND).json({ msg: "PDF not found" });
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
