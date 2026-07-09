import "express-async-errors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import cors from "cors";
import helmet from "helmet";
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

// Config modules
import { setupSocketIO } from "./config/socket.js";
import { generalLimiter, authLimiter, paymentLimiter } from "./config/rateLimiter.js";
import { setupUploads } from "./config/uploads.js";

// Middleware
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware.js";
import mongoSanitize from "express-mongo-sanitize";
import { sanitizeInput } from "./middleware/validationMiddleware.js";
import { cleanupUploadOnError } from "./middleware/fileUploadMiddleware.js";
import { requireIdempotency } from "./modules/idempotency/idempotencyMiddleware.js";

// Routers
import JobRouter from "./modules/job/job.route.js";
import StatsRouter from "./modules/dashboard/dashboard.route.js";
import UniversityRouter from "./modules/university/university.route.js";
import CompanyRouter from "./modules/company/company.route.js";
import ApplicationRouter from "./modules/application/application.route.js";
import CollegeRouter from "./modules/college/college.route.js";
import BranchRouter from "./modules/branch/branch.route.js";
import DegreeRouter from "./modules/degree/degree.route.js";
import DegreeMasterRoutes from "./modules/degree/degreemaster.route.js";
import StudentRouter from "./modules/student/student.route.js";
import CvTemplateRouter from "./modules/student/cvTemplate.route.js";
import TPORouter from "./modules/tpo/tpo.route.js";
import authRouter from "./modules/auth/auth.route.js";
import LoginRouter from "./modules/auth/login.route.js";
import userRouter from "./modules/auth/user.route.js";
import DropdownRouter from "./modules/dropdown/dropdown.route.js";
import ExamRouter from "./modules/exam/exam.route.js";
import PaperRouter from "./modules/exam/paper.route.js";
import ContactRouter from "./modules/contact/contact.route.js";
import PaymentRouter from "./modules/subscription/payment.route.js";
import ExamPaymentRouter from "./modules/subscription/exampayment.route.js";
import RoundRouter from "./modules/interview/round.route.js";
import InterviewRouter from "./modules/interview/interview.route.js";
import RecruitmentSubscriptionRouter from "./modules/subscription/subscription.route.js";
import { getActivePlans } from "./modules/subscription/subscription.controller.js";
import PreparationRouter from "./modules/preparation/preparation.route.js";
import UploadRouter from "./modules/upload/upload.route.js";

import { authenticateUser, requireStudentSubscription } from "./middleware/authMiddleware.js";

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map(url => url.trim())
  : ["http://localhost:5173", "http://localhost:4173", "http://localhost:5174"];

const app = express();
app.set("trust proxy", 1);

// Middleware to clean client IP address (removing port number if forwarded by reverse proxy like IIS ARR)
app.use((req, res, next) => {
  const rawIp = req.ip;
  if (rawIp) {
    let cleanIp = rawIp;
    if (cleanIp.includes('.')) {
      cleanIp = cleanIp.split(':')[0];
    } else if (cleanIp.startsWith('[') && cleanIp.includes(']')) {
      cleanIp = cleanIp.substring(1, cleanIp.indexOf(']'));
    }
    Object.defineProperty(req, 'ip', {
      value: cleanIp,
      configurable: true,
      enumerable: true,
      writable: true
    });
  }
  next();
});

const server = http.createServer(app);

// Socket.IO for real-time proctoring
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Setup Socket.IO Event Handlers
setupSocketIO(io);

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}



// Serve uploaded files securely
setupUploads(app, serverRoot);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization middleware
app.use(sanitizeInput);

// Apply rate limiting & idempotency
app.use("/api/", generalLimiter); // General rate limiting for all API routes
app.use("/api/", requireIdempotency); // Enforce request idempotency (anti-duplicate guard)
app.use("/api/auth", authLimiter); // Strict limiting for auth routes
app.use("/api/login", authLimiter); // Strict limiting for login routes
app.use("/api/order", paymentLimiter); // Strict limiting for payment routes
app.use("/api/payment", paymentLimiter); // Strict limiting for payment routes

// Health check
app.get("/api/test", (req, res) => {
  res.json({ message: "The Spot Campus Final API v2.0 - Running" });
});

// Certificate Transparency report endpoint
app.post("/api/ct-report", (req, res) => {
  console.log("CT Report received:", req.body);
  res.status(200).json({ received: true });
});

// Content Security Policy violation report endpoint
app.post("/api/csp-report", (req, res) => {
  console.log("CSP Violation:", req.body);
  res.status(200).json({ received: true });
});

// Mount Routes directly
app.use("/api/jobs", authenticateUser, JobRouter);
app.use("/api/stats", authenticateUser, StatsRouter);
app.use("/api/contact", ContactRouter);
app.use("/api/university", UniversityRouter);
app.use("/api/dropdown", DropdownRouter);
app.use("/api/order", authenticateUser, PaymentRouter);
app.use("/api/payment", authenticateUser, PaymentRouter);
app.use("/api/aiexam", authenticateUser, ExamPaymentRouter);
app.use("/api/exam", authenticateUser, ExamRouter);
app.use("/api/paper", authenticateUser, PaperRouter);
app.use("/api/rounds", authenticateUser, RoundRouter);
app.use("/api/interviews", authenticateUser, InterviewRouter);
app.get("/api/recruitment-subscription/plans/active", getActivePlans);
app.use("/api/recruitment-subscription", authenticateUser, RecruitmentSubscriptionRouter);
app.use("/api/preparation", authenticateUser, requireStudentSubscription, PreparationRouter);
app.use("/api/upload", UploadRouter);
app.use("/api/company", CompanyRouter);
app.use("/api/application", authenticateUser, ApplicationRouter);
app.use("/api/college", CollegeRouter);
app.use("/api/branch", authenticateUser, BranchRouter);
app.use("/api/degree", authenticateUser, DegreeRouter);
app.use("/api/degreeMaster", DegreeMasterRoutes);
app.use("/api/student", authenticateUser, StudentRouter);
app.use("/api/cv-templates", authenticateUser, CvTemplateRouter);
app.use("/api/register", StudentRouter);
app.use("/api/tpo", authenticateUser, TPORouter);
app.use("/api/auth", authRouter);
app.use("/api/login", LoginRouter);
app.use("/api/logout", LoginRouter);
app.use("/api/users", authenticateUser, userRouter);


// Serve static frontend assets from client/dist in production
const clientDistPath = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// Fallback for React Router client-side routes
app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.resolve(clientDistPath, "index.html"), (err) => {
    if (err) {
      next();
    }
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ msg: "not found" });
});

// File upload error cleanup middleware
app.use(cleanupUploadOnError);

app.use(errorHandlerMiddleware);

export { app, server, io };
