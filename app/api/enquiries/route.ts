import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Enquiry from "@/models/Enquiry";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query: any = {};
    
    // Only fetch enquiries assigned to the teacher if they are not an admin
    if (user.role === "teacher") {
      query.assignedTo = user.id;
    }

    if (status) {
      query.status = status;
    }

    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ enquiries });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching enquiries", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const newEnquiry = new Enquiry({
      ...body,
      // Default to assigning to the creator if they are a teacher, or left empty if admin
      assignedTo: body.assignedTo || (user.role === "teacher" ? user.id : undefined),
    });

    await newEnquiry.save();

    return NextResponse.json(
      { message: "Enquiry created successfully", enquiry: newEnquiry },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error creating enquiry", error: error.message },
      { status: 500 }
    );
  }
}
