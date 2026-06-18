import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import { Announcement } from "@/models/Announcement";
import { AuditLogger } from "@/lib/audit/AuditLogger";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const announcement = await Announcement.findOne({ _id: id, isDeleted: false })
      .populate("createdBy", "name email");

    if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(announcement);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    let finalExpiryDate = undefined;
    if (expiryDate && expiryDate !== "undefined" && expiryDate !== "null") {
      finalExpiryDate = new Date(expiryDate);
      finalExpiryDate.setUTCHours(23, 59, 59, 999);
    }

    const { id } = await params;
    await connectDB();

    const oldAnnouncement = await Announcement.findById(id);
    if (!oldAnnouncement || oldAnnouncement.isDeleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (priority) updates.priority = priority;
    if (finalExpiryDate !== undefined) updates.expiryDate = finalExpiryDate;
    if (isActive !== undefined) updates.isActive = isActive;

    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image exceeds 5MB limit" }, { status: 400 });
      }
      
      // Delete old image if it exists
      if (oldAnnouncement.imagePublicId) {
        await deleteImage(oldAnnouncement.imagePublicId);
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadImage(buffer, "college-portal/announcements");
      updates.imageUrl = uploadResult.url;
      updates.imagePublicId = uploadResult.public_id;
    }

    const updated = await Announcement.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Determine specific action text
    let actionStr = "CIRCULAR_UPDATED";
    let descStr = `Updated circular ${updated.title}`;
    
    if (oldAnnouncement.isActive !== updated.isActive) {
      actionStr = updated.isActive ? "CIRCULAR_PUBLISHED" : "CIRCULAR_UNPUBLISHED";
      descStr = `${updated.isActive ? 'Published' : 'Unpublished'} circular ${updated.title}`;
    }

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: actionStr,
      module: "Official Circulars",
      description: descStr,
      entityId: updated._id.toString(),
      entityType: "Announcement",
      oldValues: oldAnnouncement.toObject(),
      newValues: updated.toObject(),
      req
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const announcement = await Announcement.findById(id);
    
    if (!announcement || announcement.isDeleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (announcement.imagePublicId) {
      await deleteImage(announcement.imagePublicId);
    }

    announcement.isDeleted = true;
    await announcement.save();

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "CIRCULAR_DELETED",
      module: "Official Circulars",
      description: `Deleted circular ${announcement.title}`,
      entityId: announcement._id.toString(),
      entityType: "Announcement",
      req
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
