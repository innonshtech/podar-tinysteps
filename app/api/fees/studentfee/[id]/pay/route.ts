import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import StudentFee from "@/models/StudentFee";
import { verifyToken } from "@/lib/auth";

// POST /api/fees/studentfee/[id]/pay — Record payment on a StudentFee record
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);
    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amountPaid, paymentMethod, paymentNote } = body;

    if (!amountPaid || Number(amountPaid) <= 0) {
      return NextResponse.json({ message: "Valid amount required" }, { status: 400 });
    }

    const fee = await StudentFee.findById(params.id);
    if (!fee) {
      return NextResponse.json({ message: "Fee record not found" }, { status: 404 });
    }

    const newPaid = Math.min(fee.totalAmount, fee.paidAmount + Number(amountPaid));
    const pending = fee.totalAmount - newPaid;

    let status: "Paid" | "Partial" | "Unpaid" = "Unpaid";
    if (pending <= 0) status = "Paid";
    else if (newPaid > 0) status = "Partial";

    const updated = await StudentFee.findByIdAndUpdate(
      params.id,
      {
        paidAmount: newPaid,
        status,
        paymentMethod: paymentMethod || "Cash",
        paymentNote: paymentNote || "",
        ...(status === "Paid" && { paidAt: new Date() }),
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      fee: updated,
      message: `Payment of ₹${Number(amountPaid).toLocaleString("en-IN")} recorded. Status: ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
