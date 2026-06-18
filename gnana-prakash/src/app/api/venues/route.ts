import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import Venue from "@/models/Venue";
import "@/models/District";
import "@/models/Mandal";

import { AuditLogger } from "@/lib/audit/AuditLogger";

export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const district = searchParams.get("district");
    const mandal = searchParams.get("mandal");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = { isActive: true };
    if (district) {
      if (district.includes(",")) query.district = { $in: district.split(",") };
      else query.district = district;
    }
    if (mandal) {
      if (mandal.includes(",")) query.mandal = { $in: mandal.split(",") };
      else query.mandal = mandal;
    }
    if (search) query.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Venue.find(query).populate("district", "name").populate("mandal", "name").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Venue.countDocuments(query),
    ]);
    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("[GET Venues Error]", error);
    return NextResponse.json({ error: error.message || "Server error", stack: error.stack }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const venue = await Venue.create(body);

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "VENUE_CREATED",
      module: "Venues",
      description: `Created venue ${venue.name}`,
      entityId: venue._id.toString(),
      entityType: "Venue",
      newValues: venue.toObject(),
      req
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error: any) {
    console.error("[POST Venues Error]", error);
    return NextResponse.json({ error: error.message || "Server error", stack: error.stack }, { status: 500 });
  }
}
