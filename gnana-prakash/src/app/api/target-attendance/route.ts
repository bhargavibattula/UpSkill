import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import TargetAttendance from "@/models/TargetAttendance";
import { AuditLogger } from "@/lib/audit/AuditLogger";

export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const data = await TargetAttendance.find({}).sort({ date: -1 }).lean();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session || !["SUPER_ADMIN", "STATE_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    // Prevent duplicate records for the same program on the same date
    const targetDate = new Date(body.date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existing = await TargetAttendance.findOne({
      title: body.title,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existing) {
      return NextResponse.json({ error: "A target attendance record for this program on this date already exists." }, { status: 400 });
    }

    const record = await TargetAttendance.create({
      ...body,
      createdBy: session.user.sub || (session.user as any).id,
    });

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "SETTINGS_CHANGED",
      module: "Target Attendance",
      description: `Created target attendance record for ${record.title}`,
      entityId: record._id.toString(),
      entityType: "TargetAttendance",
      newValues: record.toObject(),
      req
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
