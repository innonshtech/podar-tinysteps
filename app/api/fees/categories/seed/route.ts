import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeCategory from "@/models/FeeCategory";
import StudentFee from "@/models/StudentFee";
import Student from "@/models/Student";
import Class from "@/models/Class";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 });
    }

    // Check if already seeded
    const existing = await FeeCategory.countDocuments();
    if (existing > 0) {
      return NextResponse.json({ message: "Seed data already exists", count: existing });
    }

    // Get first available class to attach seed data to
    const firstClass = await Class.findOne().lean() as any;
    const classId = firstClass?._id;

    if (!classId) {
      return NextResponse.json({ message: "No classes found. Please create a class first." }, { status: 400 });
    }

    const seedCategories = [
      {
        name: "Uniform Fee",
        description: "School uniform set including shirt, trouser/skirt and tie",
        amount: 1500,
        classId,
        dueDate: new Date("2026-06-15"),
        frequency: "one-time",
        createdBy: user.id,
        createdByRole: "admin",
        active: true,
      },
      {
        name: "Annual Day Fee",
        description: "Annual day celebration event and costume charges",
        amount: 500,
        classId,
        dueDate: new Date("2026-06-30"),
        frequency: "one-time",
        createdBy: user.id,
        createdByRole: "admin",
        active: true,
      },
      {
        name: "Art & Craft Supplies",
        description: "Monthly art supplies including colors, clay, paper etc.",
        amount: 300,
        classId,
        dueDate: new Date("2026-06-05"),
        frequency: "monthly",
        createdBy: user.id,
        createdByRole: "admin",
        active: true,
      },
    ];

    const created = await FeeCategory.insertMany(seedCategories);

    // Assign StudentFee to students in the first class
    const students = await Student.find({ classId }).lean() as any[];
    const studentFees: any[] = [];

    for (const cat of created) {
      for (const student of students) {
        studentFees.push({
          studentId: student._id,
          categoryId: cat._id,
          classId,
          createdBy: user.id,
          category: cat.name,
          totalAmount: cat.amount,
          paidAmount: 0,
          status: "Unpaid",
          dueDate: cat.dueDate,
          description: cat.description,
          notificationSent: false,
        });
      }
    }

    if (studentFees.length > 0) {
      await StudentFee.insertMany(studentFees);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${created.length} fee categories and ${studentFees.length} student fee records`,
      categories: created.map((c) => c.name),
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
