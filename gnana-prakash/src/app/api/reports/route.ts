import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import Program from "@/models/Program";
import Participant from "@/models/Participant";
import Attendance from "@/models/Attendance";
import Venue from "@/models/Venue";
import FoodRecord from "@/models/FoodRecord";
import Photo from "@/models/Photo";
import District from "@/models/District";
import Mandal from "@/models/Mandal";

export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "attendance";
    const programId = searchParams.get("programId");
    const district = searchParams.get("district");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateQuery = (field: string) => {
      const q: Record<string, any> = {};
      if (from) q[field] = { ...q[field], $gte: new Date(from + "T00:00:00.000Z") };
      if (to) {
        q[field] = { ...q[field], $lte: new Date(to + "T23:59:59.999Z") };
      }
      return q;
    };

    let reportData: Record<string, unknown>[] = [];

    if (type === "attendance") {
      const query: Record<string, any> = {};
      if (programId) query.program = programId;
      if (from || to) Object.assign(query, dateQuery("date"));
      if (district) {
        const programs = await Program.find({ district }).select("_id").lean();
        const programIds = programs.map(p => String(p._id));
        if (query.program) {
          if (!programIds.includes(query.program.toString())) {
            return NextResponse.json([]);
          }
        } else {
          query.program = { $in: programIds };
        }
      }
      reportData = await Attendance.find(query).populate("program", "programName").lean() as unknown as Record<string, unknown>[];

    } else if (type === "participant") {
      const query: Record<string, any> = {};
      if (programId) query.program = programId;
      if (from || to) Object.assign(query, dateQuery("registrationDate"));
      if (district) {
        query.district = district.toString();
      }
      reportData = await Participant.find(query).populate("program", "programName").lean() as unknown as Record<string, unknown>[];

    } else if (type === "venue") {
      const query: Record<string, any> = {};
      if (district) query.district = district;
      
      const programQuery: Record<string, any> = {};
      if (district) programQuery.district = district;
      if (programId) programQuery._id = programId;
      if (from || to) {
        if (from) programQuery.endDate = { $gte: new Date(from + "T00:00:00.000Z") };
        if (to) programQuery.startDate = { ...programQuery.startDate, $lte: new Date(to + "T23:59:59.999Z") };
      }
      if (programId || from || to) {
        const programs = await Program.find(programQuery).select("venue").lean();
        const venueIds = programs.flatMap(p => Array.isArray(p.venue) ? p.venue : [p.venue]).filter(Boolean);
        query._id = { $in: venueIds };
      }
      reportData = await Venue.find(query).populate("district mandal").lean() as unknown as Record<string, unknown>[];

    } else if (type === "food") {
      const query: Record<string, any> = {};
      if (programId) query.program = programId;
      if (from || to) Object.assign(query, dateQuery("date"));
      if (district) {
        const programs = await Program.find({ district }).select("_id").lean();
        const programIds = programs.map(p => String(p._id));
        if (query.program) {
          if (!programIds.includes(query.program.toString())) {
            return NextResponse.json([]);
          }
        } else {
          query.program = { $in: programIds };
        }
      }
      reportData = await FoodRecord.find(query).populate("program", "programName").lean() as unknown as Record<string, unknown>[];

    } else if (type === "photo") {
      const query: Record<string, any> = {};
      if (programId) query.program = programId;
      if (from || to) Object.assign(query, dateQuery("uploadDate"));
      if (district) {
        const programs = await Program.find({ district }).select("_id").lean();
        const programIds = programs.map(p => String(p._id));
        if (query.program) {
          if (!programIds.includes(query.program.toString())) {
            return NextResponse.json([]);
          }
        } else {
          query.program = { $in: programIds };
        }
      }
      reportData = await Photo.find(query).populate("program", "programName").lean() as unknown as Record<string, unknown>[];

    } else if (type === "consolidated") {
      const query: Record<string, any> = {};
      if (programId) query._id = programId;
      if (district) query.district = district;
      if (from || to) {
        if (from) query.endDate = { $gte: new Date(from + "T00:00:00.000Z") };
        if (to) query.startDate = { ...query.startDate, $lte: new Date(to + "T23:59:59.999Z") };
      }
      reportData = await Program.find(query).populate("district mandal venue").lean() as unknown as Record<string, unknown>[];
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Reports generation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
