import mongoose from "mongoose";
import dns from "dns";
import * as dotenv from "dotenv";
import { BUILTIN_LAYOUTS } from "../utils/cvTemplates.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

async function runMigration() {
  try {
    console.log("Connecting to:", process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);
    
    const CvTemplate = mongoose.models.tbl_cv_template || mongoose.model("tbl_cv_template", new mongoose.Schema({
      name: String,
      html_content: String,
      css_content: String
    }, { strict: false }));

    const templates = await CvTemplate.find({});
    console.log(`Found ${templates.length} templates in database.`);

    let updatedCount = 0;
    for (const t of templates) {
      const cleanName = (t.name || "").toLowerCase().trim();
      if (cleanName.includes("cv 1") || cleanName.includes("cv-1") || cleanName.includes("cv1")) {
        console.log(`Updating template ${t.name} to CV1...`);
        t.html_content = BUILTIN_LAYOUTS.cv1.html;
        t.css_content = BUILTIN_LAYOUTS.cv1.css;
        await t.save();
        updatedCount++;
      } else if (cleanName.includes("cv 2") || cleanName.includes("cv-2") || cleanName.includes("cv2")) {
        console.log(`Updating template ${t.name} to CV2...`);
        t.html_content = BUILTIN_LAYOUTS.cv2.html;
        t.css_content = BUILTIN_LAYOUTS.cv2.css;
        await t.save();
        updatedCount++;
      } else if (cleanName.includes("cv 3") || cleanName.includes("cv-3") || cleanName.includes("cv3")) {
        console.log(`Updating template ${t.name} to CV3...`);
        t.html_content = BUILTIN_LAYOUTS.cv3.html;
        t.css_content = BUILTIN_LAYOUTS.cv3.css;
        await t.save();
        updatedCount++;
      }
    }
    console.log(`Successfully migrated ${updatedCount} templates.`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runMigration();
