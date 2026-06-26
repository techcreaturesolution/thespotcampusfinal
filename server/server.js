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
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

// Config modules
import { connectToMongoDB } from "./src/config/db.js";
import { setupSocketIO } from "./src/config/socket.js";
import { generalLimiter, authLimiter, paymentLimiter } from "./src/config/rateLimiter.js";
import { setupRoutes } from "./src/config/routes.js";
import { setupUploads } from "./src/config/uploads.js";

// Middleware
import errorHandlerMiddleware from "./src/middleware/errorHandlerMiddleware.js";
import mongoSanitize from "express-mongo-sanitize";
import { sanitizeInput } from "./src/middleware/validationMiddleware.js";
import { cleanupUploadOnError } from "./src/middleware/fileUploadMiddleware.js";

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT. Graceful shutdown...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map(url => url.trim())
  : ["http://localhost:5173", "http://localhost:4173", "http://localhost:5174"];

const app = express();
app.set("trust proxy", 1);
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

// Serve uploaded files securely
setupUploads(app, __dirname);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization middleware
app.use(sanitizeInput);

// Apply rate limiting
app.use("/api/", generalLimiter); // General rate limiting for all API routes
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

// Mount Routes
setupRoutes(app);

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
});

app.use("*", (req, res) => {
  res.status(404).json({ msg: "not found" });
});

// File upload error cleanup middleware
app.use(cleanupUploadOnError);

app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

try {
  await connectToMongoDB();

  server.listen(port, () => {
    console.log(`\n🚀 Server running on PORT ${port}`);
    console.log(`🌐 URL: http://localhost:${port}`);
  });
} catch (error) {
  console.error('🔴 Server startup failed:', error.message);
  process.exit(1);
}

export { io };
