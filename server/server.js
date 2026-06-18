import "express-async-errors";
import * as dotenv from "dotenv";
dotenv.config();
import dns from "dns";

// Set DNS servers to Google's public DNS to bypass ISP/IPv6 DNS resolution bugs with MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

// Routers
import JobRouter from "./src/modules/job/job.route.js";
import StatsRouter from "./src/modules/dashboard/dashboard.route.js";
import UniversityRouter from "./src/modules/university/university.route.js";
import CompanyRouter from "./src/modules/company/company.route.js";
import ApplicationRouter from "./src/modules/application/application.route.js";
import CollegeRouter from "./src/modules/college/college.route.js";
import BranchRouter from "./src/modules/branch/branch.route.js";
import DegreeRouter from "./src/modules/degree/degree.route.js";
import DegreeMasterRoutes from "./src/modules/degree/degreemaster.route.js";
import StudentRouter from "./src/modules/student/student.route.js";
import CvTemplateRouter from "./src/modules/student/cvTemplate.route.js";
import TPORouter from "./src/modules/tpo/tpo.route.js";
import authRouter from "./src/modules/auth/auth.route.js";
import LoginRouter from "./src/modules/auth/login.route.js";
import userRouter from "./src/modules/auth/user.route.js";
import DropdownRouter from "./src/modules/dropdown/dropdown.route.js";
import ExamRouter from "./src/modules/exam/exam.route.js";
import PaperRouter from "./src/modules/exam/paper.route.js";
import ContactRouter from "./src/modules/contact/contact.route.js";
import PaymentRouter from "./src/modules/subscription/payment.route.js";
import ExamPaymentRouter from "./src/modules/subscription/exampayment.route.js";
import RoundRouter from "./src/modules/interview/round.route.js";
import InterviewRouter from "./src/modules/interview/interview.route.js";
import RecruitmentSubscriptionRouter from "./src/modules/subscription/subscription.route.js";
import { getActivePlans } from "./src/modules/subscription/subscription.controller.js";

// Middleware
import errorHandlerMiddleware from "./src/middleware/errorHandlerMiddleware.js";
import { authenticateUser } from "./src/middleware/authMiddleware.js";

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map(url => url.trim())
  : ["http://localhost:5173", "http://localhost:4173"];

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time proctoring
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Socket.IO proctoring events
io.on("connection", (socket) => {
  console.log("Proctoring client connected:", socket.id);

  socket.on("join-exam", (data) => {
    socket.join(`exam-${data.examId}`);
    socket.join(`student-${data.studentId}`);
  });

  socket.on("violation", (data) => {
    io.to(`exam-${data.examId}`).emit("student-violation", {
      studentId: data.studentId,
      type: data.type,
      timestamp: new Date(),
      details: data.details,
    });
  });

  socket.on("camera-snapshot", (data) => {
    io.to(`exam-${data.examId}`).emit("student-snapshot", {
      studentId: data.studentId,
      imageUrl: data.imageUrl,
      faceDetected: data.faceDetected,
      multipleFaces: data.multipleFaces,
      timestamp: new Date(),
    });
  });

  socket.on("exam-auto-submit", (data) => {
    io.to(`student-${data.studentId}`).emit("force-submit", {
      reason: data.reason,
    });
  });

  // Video Interview signaling
  socket.on("join-interview", (data) => {
    socket.join(`interview-${data.roomId}`);
    socket.to(`interview-${data.roomId}`).emit("user-joined", {
      userId: data.userId,
      userName: data.userName,
      role: data.role,
    });
  });

  socket.on("interview-offer", (data) => {
    socket.to(`interview-${data.roomId}`).emit("interview-offer", {
      offer: data.offer,
      userId: data.userId,
      userName: data.userName,
      role: data.role,
    });
  });

  socket.on("interview-answer", (data) => {
    socket.to(`interview-${data.roomId}`).emit("interview-answer", {
      answer: data.answer,
      userId: data.userId,
      userName: data.userName,
      role: data.role,
    });
  });

  socket.on("interview-ice-candidate", (data) => {
    socket.to(`interview-${data.roomId}`).emit("interview-ice-candidate", {
      candidate: data.candidate,
      userId: data.userId,
    });
  });

  socket.on("interview-chat", (data) => {
    io.to(`interview-${data.roomId}`).emit("interview-chat", {
      userId: data.userId,
      userName: data.userName,
      message: data.message,
      timestamp: new Date(),
    });
  });

  socket.on("leave-interview", (data) => {
    socket.to(`interview-${data.roomId}`).emit("user-left", {
      userId: data.userId,
      userName: data.userName,
    });
    socket.leave(`interview-${data.roomId}`);
  });
  
  socket.on("end-interview", (data) => {
    socket.to(`interview-${data.roomId}`).emit("interview-ended-by-peer", {
      userId: data.userId,
      userName: data.userName,
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

const __dirname = dirname(fileURLToPath(import.meta.url));

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

app.use(express.static(path.resolve(__dirname, "../client/dist")));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/test", (req, res) => {
  res.json({ message: "The Spot Campus Final API v2.0 - Running" });
});

// Routes
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

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
});

app.use("*", (req, res) => {
  res.status(404).json({ msg: "not found" });
});

app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

try {
  await mongoose.connect(process.env.MONGO_URL);
  
  // Seed default templates if database is empty on server startup
  try {
    const { seedDefaultTemplates } = await import("./src/modules/student/cvTemplate.controller.js");
    await seedDefaultTemplates();
  } catch (seedErr) {
    console.error("Failed to seed default CV templates on server startup:", seedErr);
  }

  server.listen(port, () => {
    console.log(`The Spot Campus Final server running on PORT ${port}....`);
  });
} catch (error) {
  console.log(error);
  process.exit(1);
}

export { io };
// Force reload env config
