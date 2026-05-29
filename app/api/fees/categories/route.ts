import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeCategory from "@/models/FeeCategory";
import StudentFee from "@/models/StudentFee";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import Class from "@/models/Class";
import Notification from "@/models/Notification";
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
    const classId = url.searchParams.get("classId");

    let filter: any = { active: true };

    if (user.role === "teacher") {
      // Scope to teacher's own classes only
      const teacher = await Teacher.findById(user.id).lean() as any;
      const teacherClassIds = (teacher?.classes || []).map((c: any) =>
        c.classId ? c.classId.toString() : c.toString()
      );

      // Also check Class.teachers array
      const classesWithTeacher = await Class.find({ teachers: user.id }, { _id: 1 }).lean();
      const allClassIds = [
        ...teacherClassIds,
        ...classesWithTeacher.map((c: any) => c._id.toString()),
      ];
      const uniqueClassIds = [...new Set(allClassIds)];

      if (classId && uniqueClassIds.includes(classId)) {
        filter.classId = classId;
      } else if (uniqueClassIds.length > 0) {
        filter.classId = { $in: uniqueClassIds };
      } else {
        return NextResponse.json({ success: true, categories: [] });
      }
    } else if (classId) {
      filter.classId = classId;
    }

    const categories = await FeeCategory.find(filter)
      .sort({ createdAt: -1 })
      .populate("classId", "name section")
      .lean();

    // For each category, compute summary stats
    const categoryWithStats = await Promise.all(
      categories.map(async (cat: any) => {
        const fees = await StudentFee.find({ categoryId: cat._id }).lean() as any[];
        const totalStudents = fees.length;
        const totalAmount = fees.reduce((s, f) => s + (f.totalAmount || 0), 0);
        const collected = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
        const pending = totalAmount - collected;
        const paidCount = fees.filter((f) => f.status === "Paid").length;
        const unpaidCount = fees.filter((f) => f.status === "Unpaid").length;
        const partialCount = fees.filter((f) => f.status === "Partial").length;

        return {
          ...cat,
          stats: { totalStudents, totalAmount, collected, pending, paidCount, unpaidCount, partialCount },
        };
      })
    );

    return NextResponse.json({ success: true, categories: categoryWithStats });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, amount, classId, dueDate, frequency } = body;

    if (!name?.trim() || !amount || !classId || !dueDate) {
      return NextResponse.json(
        { message: "Name, amount, classId and dueDate are required" },
        { status: 400 }
      );
    }

    // If teacher: verify they are assigned to this class
    if (user.role === "teacher") {
      const teacher = await Teacher.findById(user.id).lean() as any;
      const teacherClassIds = (teacher?.classes || []).map((c: any) =>
        c.classId ? c.classId.toString() : c.toString()
      );
      const classesWithTeacher = await Class.find({ teachers: user.id }, { _id: 1 }).lean();
      const allClassIds = [
        ...teacherClassIds,
        ...classesWithTeacher.map((c: any) => c._id.toString()),
      ];
      if (!allClassIds.includes(classId)) {
        return NextResponse.json(
          { message: "You can only create fee categories for your own class" },
          { status: 403 }
        );
      }
    }

    // Create the fee category
    const category = await FeeCategory.create({
      name: name.trim(),
      description: description?.trim() || "",
      amount: Number(amount),
      classId,
      dueDate: new Date(dueDate),
      frequency: frequency || "one-time",
      createdBy: user.id,
      createdByRole: user.role,
    });

    // Find all students in this class
    const students = await Student.find({ classId }).lean() as any[];

    // Create a StudentFee record for each student
    const studentFees = students.map((student) => ({
      studentId: student._id,
      categoryId: category._id,
      classId,
      createdBy: user.id,
      category: name.trim(),
      totalAmount: Number(amount),
      paidAmount: 0,
      status: "Unpaid",
      dueDate: new Date(dueDate),
      description: description?.trim() || "",
      notificationSent: false,
    }));

    if (studentFees.length > 0) {
      await StudentFee.insertMany(studentFees);
    }

    // Create parent notifications for each student
    const notifications = [];
    for (const student of students) {
      // Get parent IDs if stored
      const parentIds = (student.parents || [])
        .map((p: any) => p.parentId)
        .filter(Boolean);

      for (const parentId of parentIds) {
        notifications.push({
          recipientId: parentId,
          type: "fee",
          title: `New Fee: ${name.trim()}`,
          message: `A new fee of ₹${Number(amount).toLocaleString("en-IN")} for "${name.trim()}" has been added for ${student.firstName} ${student.lastName || ""}. Due date: ${new Date(dueDate).toLocaleDateString("en-IN")}.`,
          relatedId: category._id,
          relatedModel: "FeeCategory",
          priority: "high",
          isRead: false,
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Update notification count on category
    await FeeCategory.findByIdAndUpdate(category._id, {
      notificationsCount: notifications.length,
    });

    return NextResponse.json(
      {
        success: true,
        category,
        studentsAssigned: studentFees.length,
        notificationsSent: notifications.length,
        message: `Fee category created and assigned to ${studentFees.length} student${studentFees.length !== 1 ? "s" : ""}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Fee category creation error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
