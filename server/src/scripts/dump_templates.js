import mongoose from "mongoose";
import dns from "dns";
import * as dotenv from "dotenv";
import fs from "fs";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

async function dump() {
  try {
    console.log("Connecting to:", process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);
    const CvTemplate = mongoose.models.tbl_cv_template || mongoose.model("tbl_cv_template", new mongoose.Schema({
      name: String,
      html_content: String,
      css_content: String
    }, { strict: false }));

    const templates = await CvTemplate.find({});
    console.log(`Found ${templates.length} templates.`);
    fs.writeFileSync("./dumped_templates.json", JSON.stringify(templates, null, 2), "utf8");
    console.log("Dumped to dumped_templates.json");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

dump();
