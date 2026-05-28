import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Enquiry from "@/models/Enquiry";
import { verifyToken } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return NextResponse.json({ message: "Enquiry not found" }, { status: 404 });
    }

    // Optional: check permissions to update this enquiry

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    return NextResponse.json({ message: "Enquiry updated", enquiry: updatedEnquiry });
  } catch (error: any) {
    return NextResponse.json({ message: "Error updating enquiry", error: error.message }, { status: 500 });
  }
}
