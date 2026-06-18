import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import { RegistrationRequest } from "@/models/RegistrationRequest";
import { AuditLogger } from "@/lib/audit/AuditLogger";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rejectionReason } = body;

    if (!rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    await connectDB();
    const request = await RegistrationRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: `Request is already ${request.status}` }, { status: 400 });
    }

    // Reject the request
    request.status = "REJECTED";
    request.reviewedAt = new Date();
    request.reviewedBy = (session.user as any).id;
    request.rejectionReason = rejectionReason;
    await request.save();

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "REGISTRATION_REJECTED",
      module: "Registration",
      description: `Rejected registration request for ${request.email}. Reason: ${rejectionReason}`,
      entityId: request._id.toString(),
      entityType: "RegistrationRequest",
      req
    });

    return NextResponse.json({ success: true, message: "Registration request rejected." });
  } catch (error: any) {
    console.error("PUT /reject error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
