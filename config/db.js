import dns from "node:dns";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

import mongoose from "mongoose";

// 1. Connection logic
export async function connectDB() {
  try {
    const dbURI = process.env.DATABASE_URL;

    if (!dbURI) {
      throw new Error("DATABASE_URL is required");
    }

    await mongoose.connect(dbURI);
    console.log("Connected to GTA_Orders database");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}
// 2. Clean Disconnect Function
async function gracefulShutdown(signal) {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("Error during database disconnection:", err);
    process.exit(1);
  }
}

// 3. Listen for Process Exit Signals
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Triggered by Ctrl+C
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Triggered by hosting platforms (Heroku/Docker)
