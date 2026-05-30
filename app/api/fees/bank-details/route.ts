import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);
    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const settings = await Settings.findOne({}, { bankDetails: 1, schoolName: 1 }).lean() as any;

    return NextResponse.json({
      success: true,
      bankDetails: settings?.bankDetails || {},
      schoolName: settings?.schoolName || "School",
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { accountName, accountNumber, ifscCode, bankName, branchName, upiId, upiName } = body;

    await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          "bankDetails.accountName": accountName || "",
          "bankDetails.accountNumber": accountNumber || "",
          "bankDetails.ifscCode": ifscCode || "",
          "bankDetails.bankName": bankName || "",
          "bankDetails.branchName": branchName || "",
          "bankDetails.upiId": upiId || "",
          "bankDetails.upiName": upiName || "",
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "Bank details saved" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
