import { StatusCodes } from "http-status-codes";
import fs from "fs";
import path from "path";

const errorHandlerMiddleware = (err, req, res, _next) => {
  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let msg = err.message || "Something went wrong, try again later";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = StatusCodes.BAD_REQUEST;
    msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // Mongoose cast error (invalid ID)
  if (err.name === "CastError") {
    statusCode = StatusCodes.BAD_REQUEST;
    msg = `Invalid ID value: ${err.value}`;
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    statusCode = StatusCodes.BAD_REQUEST;
    msg = err.message;
  }

  // Log detailed error stack to a file in the workspace
  try {
    const logPath = path.resolve(process.cwd(), "server_errors.log");
    const logMessage = `[${new Date().toISOString()}] ${statusCode} - ${err.message}\n${err.stack}\n\n`;
    fs.appendFileSync(logPath, logMessage);
  } catch (logErr) {
    console.error("Failed to write to server_errors.log:", logErr);
  }

  res.status(statusCode).json({ msg });
};

export default errorHandlerMiddleware;
