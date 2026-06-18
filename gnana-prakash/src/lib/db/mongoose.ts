import mongoose from "mongoose";

// Import all models to ensure they are registered before population
import "@/models/Attendance";
import "@/models/AuditLog";
import "@/models/CustomField";
import "@/models/District";
import "@/models/FoodRecord";
import "@/models/Mandal";
import "@/models/Participant";
import "@/models/Photo";
import "@/models/Program";
import "@/models/Tag";
import "@/models/TargetAttendance";
import "@/models/User";
import "@/models/Venue";
import "@/models/Video";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache;
}

let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }
  cached.conn = await cached.promise;

  // Auto-seed permanent Super Admin account if it doesn't exist
  try {
    const User = (await import("@/models/User")).default;
    const adminExists = await User.findOne({ email: "admin@gnana.edu.in" });
    if (!adminExists) {
      await User.create({
        employeeId: "EMP001",
        name: "System Administrator",
        email: "admin@gnana.edu.in",
        password: "Admin@1234",
        mobile: "9000000001",
        role: "SUPER_ADMIN",
        designation: "System Administrator",
        department: "School Education",
        isActive: true,
      });
      console.log("✅ Auto-seeded permanent Super Admin account.");
    }
  } catch (e) {
    console.error("Auto-seed Super Admin error:", e);
  }

  return cached.conn;
}

export default connectDB;
