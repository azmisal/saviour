import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

if (!DB_NAME) {
  throw new Error("Please define DB_NAME in .env.local");
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;

    console.log(`✅ MongoDB connected (${DB_NAME})`);

    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}