import { Router } from "express";
const router = Router();

import { authenticateUser } from "../../middleware/authMiddleware.js";
import { 
  uploadProfileImage,
  uploadAvatar,
  uploadResume,
  uploadCV,
  uploadCompanyLogo,
  uploadDocument,
  uploadExamFile,
  uploadMultipleDocuments,
  uploadMultipleImages,
  uploadMixed,
  validateUploadedFile,
  getSecureFileUrl
} from "../../middleware/fileUploadMiddleware.js";

// Single file upload endpoints
router.post("/profile-image", 
  authenticateUser, 
  uploadProfileImage, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    res.status(200).json({
      msg: "Profile image uploaded successfully",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: getSecureFileUrl(req, req.file.filename)
      }
    });
  }
);

router.post("/avatar", 
  authenticateUser, 
  uploadAvatar, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    res.status(200).json({
      msg: "Avatar uploaded successfully",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: getSecureFileUrl(req, req.file.filename)
      }
    });
  }
);

router.post("/resume", 
  authenticateUser, 
  uploadResume, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    res.status(200).json({
      msg: "Resume uploaded successfully",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: getSecureFileUrl(req, req.file.filename)
      }
    });
  }
);

router.post("/cv", 
  authenticateUser, 
  uploadCV, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    res.status(200).json({
      msg: "CV uploaded successfully",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: getSecureFileUrl(req, req.file.filename)
      }
    });
  }
);

router.post("/company-logo", 
  authenticateUser, 
  uploadCompanyLogo, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    res.status(200).json({
      msg: "Company logo uploaded successfully",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: getSecureFileUrl(req, req.file.filename)
      }
    });
  }
);

router.post("/document", 
  authenticateUser, 
  uploadDocument, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    res.status(200).json({
      msg: "Document uploaded successfully",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: getSecureFileUrl(req, req.file.filename)
      }
    });
  }
);

router.post("/exam-file", 
  authenticateUser, 
  uploadExamFile, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    res.status(200).json({
      msg: "Exam file uploaded successfully",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: getSecureFileUrl(req, req.file.filename)
      }
    });
  }
);

// Multiple file upload endpoints
router.post("/multiple-documents", 
  authenticateUser, 
  uploadMultipleDocuments, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "No files uploaded" });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: getSecureFileUrl(req, file.filename)
    }));

    res.status(200).json({
      msg: `${req.files.length} documents uploaded successfully`,
      files: uploadedFiles
    });
  }
);

router.post("/multiple-images", 
  authenticateUser, 
  uploadMultipleImages, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "No files uploaded" });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: getSecureFileUrl(req, file.filename)
    }));

    res.status(200).json({
      msg: `${req.files.length} images uploaded successfully`,
      files: uploadedFiles
    });
  }
);

// Mixed upload endpoint (multiple field names)
router.post("/mixed", 
  authenticateUser, 
  uploadMixed, 
  validateUploadedFile, 
  (req, res) => {
    if (!req.files) {
      return res.status(400).json({ msg: "No files uploaded" });
    }

    const response = {
      msg: "Files uploaded successfully",
      files: {}
    };

    // Process each field type
    Object.keys(req.files).forEach(fieldName => {
      response.files[fieldName] = req.files[fieldName].map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url: getSecureFileUrl(req, file.filename)
      }));
    });

    res.status(200).json(response);
  }
);

// File deletion endpoint (for cleanup with strict ownership validation)
router.delete("/:filename", authenticateUser, async (req, res) => {
  try {
    const { filename } = req.params;
    const path = await import("path");
    const safeName = path.basename(filename || "");

    if (!filename || safeName !== filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ msg: "Invalid filename" });
    }

    // Verify ownership unless Admin
    if (req.user.role !== "Admin") {
      const [{ default: tbl_student }, { default: tbl_company }, { default: tbl_college }, { default: tbl_university }] =
        await Promise.all([
          import("../student/student.model.js"),
          import("../company/company.model.js"),
          import("../college/college.model.js"),
          import("../university/university.model.js"),
        ]);

      const escaped = safeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const nameRegex = new RegExp(escaped);
      let isOwner = safeName.startsWith(`${req.user.userId}_`);

      if (!isOwner && req.user.role === "Student") {
        isOwner = !!(await tbl_student.findOne({ _id: req.user.userId, $or: [{ student_image: nameRegex }, { student_resume: nameRegex }] }));
      } else if (!isOwner && req.user.role === "Company") {
        isOwner = !!(await tbl_company.findOne({ _id: req.user.userId, company_logo: nameRegex }));
      } else if (!isOwner && req.user.role === "College") {
        isOwner = !!(await tbl_college.findOne({ _id: req.user.userId, college_logo: nameRegex }));
      } else if (!isOwner && req.user.role === "University") {
        isOwner = !!(await tbl_university.findOne({ _id: req.user.userId, university_logo: nameRegex }));
      }

      if (!isOwner) {
        return res.status(403).json({ msg: "Forbidden: you do not own this file" });
      }
    }
    
    const fs = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname } = await import('path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Check in all possible directories
    const possiblePaths = [
      path.join(__dirname, '../../../uploads/profiles', filename),
      path.join(__dirname, '../../../uploads/resumes', filename),
      path.join(__dirname, '../../../uploads/logos', filename),
      path.join(__dirname, '../../../uploads/documents', filename),
      path.join(__dirname, '../../../uploads/exams', filename),
      path.join(__dirname, '../../../uploads/misc', filename)
    ];

    let fileDeleted = false;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        fileDeleted = true;
        break;
      }
    }

    if (fileDeleted) {
      res.status(200).json({ msg: "File deleted successfully" });
    } else {
      res.status(404).json({ msg: "File not found" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Error deleting file", error: error.message });
  }
});

export default router;