import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

if (!MONGODB_DB) {
  throw new Error("Please define MONGODB_DB in .env.local");
}

/**
 * Cached connection (important for Next.js hot reload)
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  try {
    const mongooseInstance = await cached.promise;

    // 👇 IMPORTANT: select DB dynamically
    cached.conn = mongooseInstance.connection.useDb(MONGODB_DB as string);

    console.log(
      `Connected to MongoDB ✨ (DB: ${MONGODB_DB})`
    );

    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

export default connectToDatabase;