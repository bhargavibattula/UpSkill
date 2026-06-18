import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import { Announcement } from "@/models/Announcement";

export async function GET(req: NextRequest) {
  try {
    // Removed auth check so announcements are public
    await connectDB();

    const query = {
      isDeleted: false,
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ]
    };

    const data = await Announcement.find(query)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/announcements/latest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
