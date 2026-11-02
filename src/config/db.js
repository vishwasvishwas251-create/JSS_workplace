// src/config/db.js
// ============================================
// MongoDB Connection Handler
// ============================================

const mongoose = require("mongoose");

// --------------------------------------------
// Connect to MongoDB
// --------------------------------------------
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ no longer needs useNewUrlParser / useUnifiedTopology
      // But keeping them is fine — they're ignored in newer versions
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

// --------------------------------------------
// Disconnect from MongoDB (useful for tests)
// --------------------------------------------
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  } catch (error) {
    console.error(`❌ MongoDB disconnect error: ${error.message}`);
  }
};

// --------------------------------------------
// Connection event listeners (optional but useful)
// --------------------------------------------
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error(`❌ MongoDB error: ${err.message}`);
});

// --------------------------------------------
// Export
// --------------------------------------------
module.exports = { connectDB, disconnectDB };