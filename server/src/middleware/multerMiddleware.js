import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExts = /jpeg|jpg|png|gif|pdf|xlsx|xls|csv/;
    const extname = allowedExts.test(
      path.extname(file.originalname).toLowerCase()
    );
    
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
      "application/octet-stream"
    ];
    const mimetype = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith("image/");
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only images, PDFs, CSV, and Excel files are allowed"));
    }
  },
});

export default upload;
