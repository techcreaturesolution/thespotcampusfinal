import mongoose from "mongoose";
import dns from "dns";

// Set DNS servers to Google's public DNS to bypass ISP/IPv6 DNS resolution bugs with MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"]);
dns.setDefaultResultOrder('ipv4first');

// MongoDB connection event listeners
mongoose.connection.on('connected', async () => {
  console.log('✅ MongoDB Connected Successfully!');
  try {
    const db = mongoose.connection.db;
    await db.collection('tbl_prep_bookmarks').dropIndex('student_id_1_item_id_1');
    console.log('🗑️  Dropped old unique index student_id_1_item_id_1 on tbl_prep_bookmarks');
  } catch (err) {
    // Index doesn't exist, which is fine
  }
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB Disconnected from Database!');
});

// Enhanced MongoDB connection with retry logic
export const connectToMongoDB = async () => {
  const mongoUrl = process.env.MONGO_URL;
  const retries = 3;
  const delay = 3000; // 3 seconds
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const mongoOptions = {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4
      };

      await mongoose.connect(mongoUrl, mongoOptions);
      return true;
      
    } catch (error) {
      console.error(`❌ Connection attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('\n🔴 ==============================================');
        console.error('🔴 MONGODB CONNECTION FAILED');  
        console.error('🔴 ==============================================\n');
        throw error;
      }
    }
  }
};
