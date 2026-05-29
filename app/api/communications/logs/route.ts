import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CommunicationLog from "@/models/CommunicationLog";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "10"));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      CommunicationLog.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name email")
        .lean(),
      CommunicationLog.countDocuments({}),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching logs", error: error.message },
      { status: 500 }
    );
  }
}
