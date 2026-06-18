import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import { Announcement } from "@/models/Announcement";
import { AuditLogger } from "@/lib/audit/AuditLogger";

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

    const body = await req.json();
    if (body.expiryDate) {
      const date = new Date(body.expiryDate);
      date.setUTCHours(23, 59, 59, 999);
      body.expiryDate = date;
    }
    const { id } = await params;
    await connectDB();

    const oldAnnouncement = await Announcement.findById(id);
    if (!oldAnnouncement || oldAnnouncement.isDeleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await Announcement.findByIdAndUpdate(
      id,
      { $set: body },
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
