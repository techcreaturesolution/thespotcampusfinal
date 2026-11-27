import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath, pathToFileURL } from "url";
import MigrationHistory from "./migration.model.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCK_ID = "__MIGRATION_LOCK__";

export async function loadMigrations() {
  const files = fs
    .readdirSync(__dirname)
    .filter((f) => /^\d{3}_.*\.js$/.test(f))
    .sort();

  const migrations = [];
  for (const file of files) {
    const fullPath = path.join(__dirname, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const checksum = crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
    const mod = await import(pathToFileURL(fullPath).href);
    migrations.push({ file, checksum, ...mod });
  }
  return migrations;
}

async function acquireLock() {
  const existing = await MigrationHistory.findOne({ migrationId: LOCK_ID });
  if (existing && existing.status === "running") {
    throw new Error(`Migration lock active since ${existing.updatedAt}`);
  }
  await MigrationHistory.findOneAndUpdate(
    { migrationId: LOCK_ID },
    { migrationId: LOCK_ID, name: "Execution Lock", status: "running" },
    { upsert: true }
  );
}

async function releaseLock() {
  await MigrationHistory.findOneAndUpdate(
    { migrationId: LOCK_ID },
    { status: "applied" }
  ).catch(() => {});
}

export async function runMigrations(command = "status") {
  const migrations = await loadMigrations();
  const db = mongoose.connection.db;

  if (command === "status") {
    const history = await MigrationHistory.find({ migrationId: { $ne: LOCK_ID } }).lean();
    const map = new Map(history.map((h) => [h.migrationId, h]));
    return migrations.map((m) => ({
      id: m.id,
      name: m.name,
      status: map.get(m.id)?.status || "pending",
      appliedAt: map.get(m.id)?.appliedAt || null,
    }));
  }

  if (command === "dry-run") {
    const report = [];
    for (const m of migrations) {
      const existing = await MigrationHistory.findOne({ migrationId: m.id });
      if (existing?.status === "applied") {
        report.push({ id: m.id, status: "already_applied" });
        continue;
      }
      const pre = m.precondition ? await m.precondition(db) : { ok: true };
      const sim = await m.up(db, { dryRun: true });
      report.push({ id: m.id, status: "would_apply", precondition: pre, simulation: sim });
    }
    return report;
  }

  if (command === "up") {
    await acquireLock();
    const results = [];
    try {
      for (const m of migrations) {
        const existing = await MigrationHistory.findOne({ migrationId: m.id });
        if (existing?.status === "applied") {
          results.push({ id: m.id, status: "skipped_applied" });
          continue;
        }
        await MigrationHistory.findOneAndUpdate(
          { migrationId: m.id },
          { migrationId: m.id, name: m.name, status: "running", checksum: m.checksum },
          { upsert: true }
        );
        try {
          const res = await m.up(db, { dryRun: false });
          await MigrationHistory.findOneAndUpdate(
            { migrationId: m.id },
            { status: "applied", appliedAt: new Date(), error: null }
          );
          results.push({ id: m.id, status: "applied", result: res });
        } catch (err) {
          await MigrationHistory.findOneAndUpdate(
            { migrationId: m.id },
            { status: "failed", error: err.message }
          );
          throw err;
        }
      }
    } finally {
      await releaseLock();
    }
    return results;
  }

  if (command === "rollback") {
    await acquireLock();
    try {
      const lastApplied = await MigrationHistory.findOne({
        migrationId: { $ne: LOCK_ID },
        status: "applied",
      }).sort("-appliedAt");
      if (!lastApplied) return { status: "nothing_to_rollback" };
      const mod = migrations.find((m) => m.id === lastApplied.migrationId);
      if (!mod || !mod.down) throw new Error(`No rollback handler for ${lastApplied.migrationId}`);
      const res = await mod.down(db);
      await MigrationHistory.findOneAndUpdate(
        { migrationId: lastApplied.migrationId },
        { status: "rolled_back", rolledBackAt: new Date() }
      );
      return { id: lastApplied.migrationId, status: "rolled_back", result: res };
    } finally {
      await releaseLock();
    }
  }

  throw new Error(`Unknown migration command: ${command}`);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const cmd = process.argv[2] || "status";
  if (!process.env.MONGO_URL) {
    console.error("MONGO_URL not set");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  const out = await runMigrations(cmd);
  console.log(JSON.stringify(out, null, 2));
  await mongoose.disconnect();
  process.exit(0);
}
