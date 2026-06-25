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

// File deletion endpoint (for cleanup)
router.delete("/:filename", authenticateUser, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security: Only allow deletion of files that belong to the user
    // You should implement proper ownership checks here
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ msg: "Invalid filename" });
    }

    // In a real application, you would check if the file belongs to the authenticated user
    // For now, this is a basic implementation
    
    const fs = await import('fs');
    const path = await import('path');
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