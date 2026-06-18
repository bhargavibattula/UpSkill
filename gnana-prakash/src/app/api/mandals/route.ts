import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import Mandal from "@/models/Mandal";

import { AuditLogger } from "@/lib/audit/AuditLogger";

export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district");
    const query: Record<string, unknown> = { isActive: true };
    if (district) {
      if (district.includes(",")) {
        query.district = { $in: district.split(",") };
      } else {
        query.district = district;
      }
    }
    const data = await Mandal.find(query).populate("district", "name").sort({ name: 1 }).lean();
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session || !["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN"].includes((session.user as any).role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const mandal = await Mandal.create(body);

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "MANDAL_CREATED",
      module: "Mandals",
      description: `Created mandal ${mandal.name}`,
      entityId: mandal._id.toString(),
      entityType: "Mandal",
      newValues: mandal.toObject(),
      req
    });

    return NextResponse.json(mandal, { status: 201 });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
