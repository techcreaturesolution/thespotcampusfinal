import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_document from "../modules/documents/document.model.js";
import { DOCUMENT_STORAGE_DIR } from "../middleware/documentUploadMiddleware.js";

dotenv.config();

/**
 * Forward migration: sync indexes on tbl_document and scan for orphaned binary files
 * in private_uploads/documents (only purges physical orphans when --purge-orphans is explicitly passed).
 */
export const up = async ({ purgeOrphans = false } = {}) => {
  await tbl_document.syncIndexes();

  let diskFiles = [];
  if (fs.existsSync(DOCUMENT_STORAGE_DIR)) {
    diskFiles = fs.readdirSync(DOCUMENT_STORAGE_DIR).filter((f) => f !== ".gitkeep");
  }

  const dbDocs = await tbl_document.find({}).select("storage_key");
  const knownKeys = new Set(dbDocs.map((d) => String(d.storage_key)));

  const orphanedFiles = diskFiles.filter((f) => !knownKeys.has(f));
  let purgedCount = 0;

  if (purgeOrphans) {
    for (const file of orphanedFiles) {
      const fullPath = path.join(DOCUMENT_STORAGE_DIR, file);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        purgedCount++;
      }
    }
  }

  return {
    indexesSynced: true,
    totalDbDocuments: dbDocs.length,
    diskFilesScanned: diskFiles.length,
    orphanedFilesFound: orphanedFiles.length,
    purgedCount,
  };
};

export const down = async () => {
  return {
    rolledBack: true,
    note: "Non-destructive rollback: stored documents and tbl_document metadata were preserved.",
  };
};

if (process.argv[1] && process.argv[1].endsWith("migrateDocuments.js")) {
  const isRollback = process.argv.includes("--rollback") || process.argv.includes("--down");
  const purgeOrphans = process.argv.includes("--purge-orphans");
  (async () => {
    await connectToMongoDB();
    const result = isRollback ? await down() : await up({ purgeOrphans });
    console.log("S1-09 migration result:", JSON.stringify(result, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  })().catch(async (err) => {
    console.error("S1-09 migration failed:", err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  });
}
