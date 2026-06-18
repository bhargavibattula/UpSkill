import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import { Announcement } from "@/models/Announcement";
import { AuditLogger } from "@/lib/audit/AuditLogger";
import { uploadImage } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    // Removed auth check so announcements are public
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const priority = searchParams.get("priority");

    const query: any = { isDeleted: false };
    if (search) query.title = { $regex: search, $options: "i" };
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Announcement.find(query)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Announcement.countDocuments(query),
    ]);

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const description = formData.get("description")?.toString();
    const priority = formData.get("priority")?.toString();
    const expiryDate = formData.get("expiryDate")?.toString();
    const isActiveStr = formData.get("isActive")?.toString();
    const isActive = isActiveStr ? isActiveStr === "true" : true;
    const file = formData.get("image") as File | null;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    await connectDB();

    let finalExpiryDate = undefined;
    if (expiryDate && expiryDate !== "undefined" && expiryDate !== "null") {
      finalExpiryDate = new Date(expiryDate);
      finalExpiryDate.setUTCHours(23, 59, 59, 999);
    }

    let imageUrl = undefined;
    let imagePublicId = undefined;

    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image exceeds 5MB limit" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadImage(buffer, "college-portal/announcements");
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.public_id;
    }

    const announcement = await Announcement.create({
      title,
      description,
      priority: priority || "INFO",
      expiryDate: finalExpiryDate,
      isActive,
      imageUrl,
      imagePublicId,
      createdBy: (session.user as any).id,
    });

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "CIRCULAR_CREATED",
      module: "Official Circulars",
      description: `Created circular ${announcement.title}`,
      entityId: announcement._id.toString(),
      entityType: "Announcement",
      newValues: announcement.toObject(),
      req
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
