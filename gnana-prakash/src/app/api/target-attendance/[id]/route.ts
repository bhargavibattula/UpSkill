import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import TargetAttendance from "@/models/TargetAttendance";
import { AuditLogger } from "@/lib/audit/AuditLogger";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session || !["SUPER_ADMIN", "STATE_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const oldRecord = await TargetAttendance.findById(id).lean();
    if (!oldRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Prevent duplicate records for the same program on the same date (excluding this record itself)
    const targetDate = new Date(body.date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existing = await TargetAttendance.findOne({
      _id: { $ne: id },
      title: body.title,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existing) {
      return NextResponse.json({ error: "A target attendance record for this program on this date already exists." }, { status: 400 });
    }

    const record = await TargetAttendance.findByIdAndUpdate(id, body, { new: true });
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "SETTINGS_CHANGED",
      module: "Target Attendance",
      description: `Updated target attendance record ${record.title}`,
      entityId: id,
      entityType: "TargetAttendance",
      oldValues: oldRecord,
      newValues: record.toObject(),
      req
    });

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session || !["SUPER_ADMIN", "STATE_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const oldRecord = await TargetAttendance.findById(id).lean();
    if (!oldRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await TargetAttendance.findByIdAndDelete(id);

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "SETTINGS_CHANGED",
      module: "Target Attendance",
      description: `Deleted target attendance record ${(oldRecord as any).title}`,
      entityId: id,
      entityType: "TargetAttendance",
      oldValues: oldRecord,
      newValues: null,
      req
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
