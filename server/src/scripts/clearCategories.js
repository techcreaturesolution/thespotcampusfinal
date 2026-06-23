import * as dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import SubjectCategory from "../modules/preparation/subject/subjectcategory.model.js";

async function clearCategories() {
  try {
    console.log("Connecting to database at:", process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected successfully!");

    const result = await SubjectCategory.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} categories from the database.`);
  } catch (error) {
    console.error("Error clearing categories:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

clearCategories();
