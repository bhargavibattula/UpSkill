import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import Program from "@/models/Program";
import District from "@/models/District";
import Mandal from "@/models/Mandal";
import Venue from "@/models/Venue";
import User from "@/models/User";
import { AuditLogger } from "@/lib/audit/AuditLogger";
import { programSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const district = searchParams.get("district");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (district) query.district = district;
    if (search) query.programName = { $regex: search, $options: "i" };

    const role = (session.user as any).role;
    const bypassScope = searchParams.get("bypassScope") === "true";
    
    if (!bypassScope) {
      if (role === "DISTRICT_ADMIN") query.district = (session.user as any).district;
      else if (["MANDAL_ADMIN","VENUE_ADMIN"].includes(role)) query.mandal = (session.user as any).mandal;
    }

    console.log("SERVER GET /api/programs INFO:", {
      userId: (session.user as any).id,
      userEmail: session.user.email,
      userRole: role,
      query,
    });

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Program.find(query).populate("district", "name").populate("mandal", "name").populate("venue", "name").populate("createdBy", "name").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Program.countDocuments(query),
    ]);

    console.log("SERVER GET /api/programs SUCCESS:", {
      totalFound: total,
      dataLength: data.length,
      firstProgram: data[0] ? { id: data[0]._id, name: data[0].programName } : null
    });

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error in GET /api/programs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = programSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });

    await connectDB();
    const start = new Date(parsed.data.startDate);
    const end = new Date(parsed.data.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const program = await Program.create({
      ...parsed.data,
      totalDays,
      createdBy: (session.user as any).id,
    });

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "PROGRAM_CREATED",
      module: "Programs",
      description: `Created program ${program.programName}`,
      entityId: program._id.toString(),
      entityType: "Program",
      newValues: program.toObject(),
      req
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/programs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
