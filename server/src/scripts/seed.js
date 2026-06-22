import * as dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import tbl_admin from "../modules/auth/admin.model.js";
import { hashPassword } from "../utils/passwordUtils.js";

async function seedMasterAdmin() {
  try {
    console.log("Connecting to database at:", process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected successfully!");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const existingAdmin = await tbl_admin.findOne({ admin_email: adminEmail });

    if (existingAdmin) {
      console.log(`Master admin already exists with email: ${adminEmail}`);
    } else {
      console.log(`Creating default master admin...`);
      const hashedPassword = await hashPassword(adminPassword);

      await tbl_admin.create({
        admin_name: "Master Admin",
        admin_email: adminEmail,
        admin_password: hashedPassword,
        role: "Admin"
      });
      console.log("Master admin created successfully!");
    }
  } catch (error) {
    console.error("Error seeding master admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

seedMasterAdmin();
