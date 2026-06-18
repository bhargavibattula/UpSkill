import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import Photo from "@/models/Photo";
import Program from "@/models/Program";
import Participant from "@/models/Participant";
import User from "@/models/User";
import { AuditLogger } from "@/lib/audit/AuditLogger";
import { uploadImage } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await connectDB();
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("program");
    const category = searchParams.get("category");
    const platform = searchParams.get("platform");
    const search = searchParams.get("search");
    const sortOrder = searchParams.get("sort") || "latest"; // latest or oldest
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");

    const userRole = (session.user as any).role || "TEACHER";
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    
    // Strict Visibility Rules:
    // 1. Before approval: Nobody can see the image except the Super Admin.
    // Therefore, if the user is NOT a Super Admin, force the status search to "Approved".
    let queryStatus = searchParams.get("status") || "Approved";
    if (!isSuperAdmin) {
      queryStatus = "Approved";
    }

    const query: Record<string, any> = {};
    if (queryStatus !== "ALL") {
      query.status = queryStatus;
    }

    // 2. Program level visibility for teachers/students (non-admins)
    const isAdmin = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "MANDAL_ADMIN", "VENUE_ADMIN"].includes(userRole);
    if (!isAdmin) {
      const email = session.user.email || "";
      const employeeId = (session.user as any).employeeId || "";
      
      const registrations = await Participant.find({
        $or: [
          { email: email.toLowerCase() },
          { employeeId: employeeId }
        ]
      }).select("program").lean();
      
      const userProgramIds = registrations.map(r => r.program).filter(Boolean);
      
      if (programId) {
        if (userProgramIds.some(id => String(id) === String(programId))) {
          query.program = programId;
        } else {
          return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 });
        }
      } else {
        query.program = { $in: userProgramIds };
      }
    } else {
      if (programId) {
        query.program = programId;
      }
    }

    // Category Filter
    if (category && category !== "ALL") {
      query.category = category;
    }

    // Platform Filter
    if (platform && platform !== "ALL") {
      query.platform = platform;
    }

    // Search query (matches title, description, or programName)
    if (search) {
      query.$or = [
        { programName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    // Sort definition (Latest First or Oldest First)
    const sortDirection = sortOrder === "oldest" ? 1 : -1;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Photo.find(query)
        .populate("program", "programName status department trainingYear")
        .populate("requestedBy", "name role")
        .populate("approvedBy", "name")
        .sort({ uploadDate: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Photo.countDocuments(query),
    ]);

    return NextResponse.json({ 
      data, 
      total, 
      page, 
      limit, 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (err: any) {
    console.error("GET photos error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = (session.user as any).role || "TEACHER";
    const isSuperAdmin = userRole === "SUPER_ADMIN";

    // Non-Super Admins are not allowed to upload directly, only submit requests.
    // Super Admin is the ONLY user who bypasses approval (goes straight to Approved).
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const programId = formData.get("program") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const platform = formData.get("platform") as string;
    const eventDateStr = formData.get("eventDate") as string;
    const additionalNotes = formData.get("additionalNotes") as string;
    const title = formData.get("title") as string;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!category) return NextResponse.json({ error: "Category field is required" }, { status: 400 });

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 });

    // Convert file to Buffer for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadImage(buffer, "college-portal/gallery");

    console.log("Cloudinary Upload Success");
    console.log(uploadResult.url);
    console.log(uploadResult.public_id);

    await connectDB();

    // Fetch corresponding program name
    let foundProgramName = "General / Independent Program";
    if (programId) {
      const progDoc = await Program.findById(programId).select("programName").lean();
      if (progDoc) {
        foundProgramName = (progDoc as any).programName;
      }
    }

    const userId = (session.user as any).id || (session.user as any)._id;
    const status = isSuperAdmin ? "Approved" : "Pending";
    const eventDate = eventDateStr ? new Date(eventDateStr) : undefined;

    const photo = await Photo.create({
      image: uploadResult.url,
      imagePublicId: uploadResult.public_id,
      url: uploadResult.url, // Backward compatibility fallback
      program: programId || undefined,
      programName: foundProgramName,
      description: description || "",
      category,
      platform: platform || "Gnana Prakash",
      status,
      requestedBy: userId,
      uploadDate: new Date(),
      approvedBy: isSuperAdmin ? userId : undefined,
      approvalDate: isSuperAdmin ? new Date() : undefined,
      eventDate,
      additionalNotes: additionalNotes || "",
      title: title || file.name || "Image Title",
      filename: file.name || "image.jpg",
      originalName: file.name || "image.jpg",
      size: file.size || 0
    });

    const auditValues = photo.toObject();
    if (auditValues.image) delete auditValues.image;
    if (auditValues.url) delete auditValues.url;

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "MEDIA_UPLOAD_REQUEST",
      module: "Photos",
      description: `Uploaded photo: ${photo.title} (${photo.filename}) for program ${photo.programName} (Status: ${status})`,
      entityId: photo._id.toString(),
      entityType: "Photo",
      newValues: auditValues,
      req
    });

    const userMessage = isSuperAdmin 
      ? "Image request approved successfully." 
      : "Your image upload request has been submitted successfully and is awaiting Super Admin approval.";

    return NextResponse.json({ 
      success: true, 
      message: userMessage, 
      data: photo 
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST photo error:", error);
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  }
}
