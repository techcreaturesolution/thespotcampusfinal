import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { BadRequestError } from '../errors/customErrors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Secure file storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    // Different directories based on file type
    switch (file.fieldname) {
      case 'profileImage':
      case 'avatar':
        uploadPath = path.join(__dirname, '../../../uploads/profiles');
        break;
      case 'resume':
      case 'cv':
        uploadPath = path.join(__dirname, '../../../uploads/resumes');
        break;
      case 'companyLogo':
        uploadPath = path.join(__dirname, '../../../uploads/logos');
        break;
      case 'documents':
        uploadPath = path.join(__dirname, '../../../uploads/documents');
        break;
      case 'examFiles':
        uploadPath = path.join(__dirname, '../../../uploads/exams');
        break;
      default:
        uploadPath = path.join(__dirname, '../../../uploads/misc');
    }
    
    createUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate secure filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = path.extname(sanitizedOriginalName);
    const baseName = path.basename(sanitizedOriginalName, fileExtension);
    
    // Limit filename length
    const truncatedBaseName = baseName.substring(0, 50);
    const secureFilename = `${truncatedBaseName}-${uniqueSuffix}${fileExtension}`;
    
    cb(null, secureFilename);
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  // Define allowed file types for different purposes
  const allowedTypes = {
    profileImage: {
      mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      extensions: ['.jpg', '.jpeg', '.png', '.webp'],
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    avatar: {
      mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      extensions: ['.jpg', '.jpeg', '.png', '.webp'],
      maxSize: 2 * 1024 * 1024 // 2MB
    },
    resume: {
      mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      extensions: ['.pdf', '.doc', '.docx'],
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    cv: {
      mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      extensions: ['.pdf', '.doc', '.docx'],
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    companyLogo: {
      mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
      extensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
      maxSize: 3 * 1024 * 1024 // 3MB
    },
    documents: {
      mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      extensions: ['.pdf', '.doc', '.docx', '.txt'],
      maxSize: 20 * 1024 * 1024 // 20MB
    },
    examFiles: {
      mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
      extensions: ['.xlsx', '.xls', '.csv'],
      maxSize: 15 * 1024 * 1024 // 15MB
    }
  };

  const fileType = allowedTypes[file.fieldname];
  
  if (!fileType) {
    return cb(new BadRequestError(`File field '${file.fieldname}' is not supported`), false);
  }

  // Check file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!fileType.extensions.includes(fileExtension)) {
    return cb(new BadRequestError(
      `Invalid file type for ${file.fieldname}. Allowed types: ${fileType.extensions.join(', ')}`
    ), false);
  }

  // Check MIME type
  if (!fileType.mimes.includes(file.mimetype)) {
    return cb(new BadRequestError(
      `Invalid MIME type for ${file.fieldname}. File appears to be: ${file.mimetype}`
    ), false);
  }

  // Additional security checks
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return cb(new BadRequestError('Invalid filename: Path traversal detected'), false);
  }

  cb(null, true);
};

// Create different multer configurations for different use cases
const createUploadConfig = (fieldName, maxFiles = 1) => {
  const allowedTypes = {
    profileImage: { maxSize: 5 * 1024 * 1024 },
    avatar: { maxSize: 2 * 1024 * 1024 },
    resume: { maxSize: 10 * 1024 * 1024 },
    cv: { maxSize: 10 * 1024 * 1024 },
    companyLogo: { maxSize: 3 * 1024 * 1024 },
    documents: { maxSize: 20 * 1024 * 1024 },
    examFiles: { maxSize: 15 * 1024 * 1024 }
  };

  const maxSize = allowedTypes[fieldName]?.maxSize || 5 * 1024 * 1024;

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: maxSize,
      files: maxFiles,
      fieldSize: 2 * 1024 * 1024, // 2MB for field data
      fieldNameSize: 100, // 100 bytes for field names
      headerPairs: 2000 // Max header pairs
    }
  });
};

// Pre-configured upload middlewares for common use cases
export const uploadProfileImage = createUploadConfig('profileImage').single('profileImage');
export const uploadAvatar = createUploadConfig('avatar').single('avatar');
export const uploadResume = createUploadConfig('resume').single('resume');
export const uploadCV = createUploadConfig('cv').single('cv');
export const uploadCompanyLogo = createUploadConfig('companyLogo').single('companyLogo');
export const uploadDocument = createUploadConfig('documents').single('documents');
export const uploadExamFile = createUploadConfig('examFiles').single('examFiles');

// Multiple files upload
export const uploadMultipleDocuments = createUploadConfig('documents', 5).array('documents', 5);
export const uploadMultipleImages = createUploadConfig('profileImage', 3).array('profileImage', 3);

// Mixed uploads (different field names)
export const uploadMixed = createUploadConfig('documents').fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'documents', maxCount: 3 }
]);

// File validation middleware (additional layer)
export const validateUploadedFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  // Function to validate individual file
  const validateFile = (file) => {
    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      throw new BadRequestError('File upload failed: File not found on server');
    }

    // Check actual file size matches reported size
    const stats = fs.statSync(file.path);
    if (Math.abs(stats.size - file.size) > 1024) { // Allow 1KB difference
      throw new BadRequestError('File upload failed: File size mismatch');
    }

    // Additional MIME type validation using file content
    // This is a basic check - for production, consider using a library like file-type
    if (file.mimetype.startsWith('image/')) {
      const buffer = fs.readFileSync(file.path, { encoding: null, start: 0, end: 10 });
      const isValidImage = 
        (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) || // JPEG
        (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) || // PNG
        (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46); // GIF

      if (!isValidImage && !file.mimetype.includes('webp') && !file.mimetype.includes('svg')) {
        fs.unlinkSync(file.path); // Delete invalid file
        throw new BadRequestError('Invalid image file: File header does not match image format');
      }
    }
  };

  try {
    // Validate single file
    if (req.file) {
      validateFile(req.file);
    }

    // Validate multiple files
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(validateFile);
      } else {
        // Handle files object (multiple fields)
        Object.values(req.files).flat().forEach(validateFile);
      }
    }

    next();
  } catch (error) {
    // Clean up any uploaded files on validation failure
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (req.files) {
      const filesToDelete = Array.isArray(req.files) 
        ? req.files 
        : Object.values(req.files).flat();
      
      filesToDelete.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    next(error);
  }
};

// Cleanup middleware for handling upload errors
export const cleanupUploadOnError = (error, req, res, next) => {
  // If there's an error and files were uploaded, clean them up
  if (error && (req.file || req.files)) {
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      if (req.files) {
        const filesToDelete = Array.isArray(req.files) 
          ? req.files 
          : Object.values(req.files).flat();
        
        filesToDelete.forEach(file => {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
    } catch (cleanupError) {
      console.error('Error cleaning up uploaded files:', cleanupError);
    }
  }
  
  next(error);
};

// Utility function to get secure file URL
export const getSecureFileUrl = (req, filename) => {
  if (!filename) return null;
  
  const protocol = req.secure || req.get('X-Forwarded-Proto') === 'https' ? 'https' : 'http';
  const host = req.get('Host');
  return `${protocol}://${host}/uploads/${filename}`;
};

// File cleanup utility (for scheduled cleanup of old files)
export const cleanupOldFiles = (directory, maxAgeInDays = 30) => {
  const now = Date.now();
  const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert to milliseconds

  try {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${filePath}`);
      }
    });
  } catch (error) {
    console.error(`Error cleaning up directory ${directory}:`, error);
  }
};