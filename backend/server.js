import "express-async-errors";
import * as dotenv from "dotenv";
dotenv.config();
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
import JobRouter from "./routes/JobRouter.js";
import StatsRouter from "./routes/DashboardRouter.js";
import UniversityRouter from "./routes/UniversityRouter.js";
import CompanyRouter from "./routes/CompanyRouter.js";
import ApplicationRouter from "./routes/ApplicationRouter.js";
import CollegeRouter from "./routes/CollegeRouter.js";
import BranchRouter from "./routes/BranchRouter.js";
import DegreeRouter from "./routes/DegreeRouter.js";
import DegreeMasterRoutes from "./routes/DegreeMasterRoutes.js";
import StudentRouter from "./routes/StudentRouter.js";
import TPORouter from "./routes/TPORouter.js";
import authRouter from "./routes/authRouter.js";
import LoginRouter from "./routes/LoginRouter.js";
import userRouter from "./routes/userRouter.js";
import DropdownRouter from "./routes/DropdownRouter.js";
import ExamRouter from "./routes/ExamRouter.js";
import PaperRouter from "./routes/PaperRouter.js";
import ContactRouter from "./routes/ContactRouter.js";
import PaymentRouter from "./routes/PaymentRouter.js";
import ExamPaymentRouter from "./routes/ExamPaymentRouter.js";

// Middleware
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware.js";
import { authenticateUser } from "./middleware/authMiddleware.js";

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time proctoring
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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

  socket.on("disconnect", () => {
    console.log("Proctoring client disconnected:", socket.id);
  });
});

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const __dirname = dirname(fileURLToPath(import.meta.url));

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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
app.get("/api/v1/test", (req, res) => {
  res.json({ message: "The Spot Campus Final API v2.0 - Running" });
});

// Routes
app.use("/api/v1/jobs", authenticateUser, JobRouter);
app.use("/api/v1/stats", authenticateUser, StatsRouter);
app.use("/api/v1/contact", ContactRouter);
app.use("/api/v1/university", UniversityRouter);
app.use("/api/v1/dropdown", DropdownRouter);
app.use("/api/v1/order", authenticateUser, PaymentRouter);
app.use("/api/v1/aiexam", authenticateUser, ExamPaymentRouter);
app.use("/api/v1/exam", authenticateUser, ExamRouter);
app.use("/api/v1/paper", authenticateUser, PaperRouter);
app.use("/api/v1/company", CompanyRouter);
app.use("/api/v1/application", authenticateUser, ApplicationRouter);
app.use("/api/v1/college", authenticateUser, CollegeRouter);
app.use("/api/v1/branch", authenticateUser, BranchRouter);
app.use("/api/v1/degree", authenticateUser, DegreeRouter);
app.use("/api/v1/degreeMaster", DegreeMasterRoutes);
app.use("/api/v1/student", authenticateUser, StudentRouter);
app.use("/api/v1/register", StudentRouter);
app.use("/api/v1/tpo", authenticateUser, TPORouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/login", LoginRouter);
app.use("/api/v1/logout", LoginRouter);
app.use("/api/v1/users", authenticateUser, userRouter);

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
  server.listen(port, () => {
    console.log(`The Spot Campus Final server running on PORT ${port}....`);
  });
} catch (error) {
  console.log(error);
  process.exit(1);
}

export { io };
