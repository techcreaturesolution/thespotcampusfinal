import IdempotencyKey from "./idempotency.model.js";
import { StatusCodes } from "http-status-codes";

/**
 * Express middleware to enforce Request Idempotency.
 * Resolves identical requests by returning cached responses to avoid duplicate actions (e.g. double payments).
 */
export const requireIdempotency = async (req, res, next) => {
  // Read idempotency key from headers
  const key = req.headers["idempotency-key"] || req.headers["x-idempotency-key"];

  // If no idempotency key is provided, skip checks and proceed normally
  if (!key) {
    return next();
  }

  // Get user ID if authenticated
  const userId = req.user ? req.user.userId : null;

  try {
    // Check if key already exists
    const existing = await IdempotencyKey.findOne({ key });

    if (existing) {
      if (existing.status === "processing") {
        // Request is currently running in another thread
        return res.status(StatusCodes.CONFLICT).json({
          msg: "Request is already in progress. Please wait.",
        });
      }

      if (existing.status === "completed") {
        // Return cached response status and body immediately
        return res.status(existing.response_status).json(existing.response_body);
      }
    }

    // Key doesn't exist, create it with "processing" status
    await IdempotencyKey.create({
      key,
      user_id: userId,
      status: "processing",
    });

    // Capture the original send to intercept response
    const originalSend = res.send;

    res.send = function (body) {
      // Restore original send immediately to prevent infinite recursion
      res.send = originalSend;

      // Handle transient server errors (5xx) by deleting the key to allow retries
      if (res.statusCode >= 500) {
        IdempotencyKey.deleteOne({ key }).catch((err) =>
          console.error("Failed to delete failed idempotency key:", err)
        );
      } else {
        let responseBody = body;
        try {
          if (typeof body === "string") {
            responseBody = JSON.parse(body);
          }
        } catch (e) {
          // Keep string if it cannot be parsed as JSON
        }

        // Cache successful/client error responses and mark as completed
        IdempotencyKey.updateOne(
          { key },
          {
            status: "completed",
            response_status: res.statusCode,
            response_body: responseBody,
          }
        ).catch((err) =>
          console.error("Failed to cache completed idempotency response:", err)
        );
      }

      return originalSend.apply(res, arguments);
    };

    next();
  } catch (error) {
    console.error("Idempotency Middleware Error:", error);
    next();
  }
};

export default requireIdempotency;
