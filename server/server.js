import "./src/config/env.js";
import "express-async-errors";

import mongoose from "mongoose";
import { connectToMongoDB } from "./src/config/db.js";
import { server } from "./src/app.js";

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

const port = process.env.PORT || 5000;

try {
  await connectToMongoDB();

  server.listen(port, () => {
    console.log(`\n🚀 Server running on http://localhost:${port}`);
  });
} catch (error) {
  console.error('🔴 Server startup failed:', error.message);
  process.exit(1);
}
