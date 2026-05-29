import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";
import StudentFee from "@/models/StudentFee";
import Teacher from "@/models/Teacher";
import Class from "@/models/Class";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "teacher"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    // Determine which class IDs this user can see
    let allowedClassIds: string[] | null = null; // null = all classes (admin)

    if (decoded.role === "teacher") {
      // Find teacher's assigned classes from both Teacher.classes and Class.teachers
      const teacher = await Teacher.findById(decoded.id).lean() as any;
      const teacherClassIds = (teacher?.classes || []).map((c: any) =>
        c.classId ? c.classId.toString() : c.toString()
      );
      const classesWithTeacher = await Class.find({ teachers: decoded.id }, { _id: 1 }).lean();
      const all = [
        ...teacherClassIds,
        ...classesWithTeacher.map((c: any) => c._id.toString()),
      ];
      allowedClassIds = [...new Set(all)];
    }

    // Build student query
    const studentFilter: any = {};
    if (allowedClassIds !== null) {
      if (allowedClassIds.length === 0) {
        return NextResponse.json({ success: true, students: [], totalClassStudents: 0 });
      }
      studentFilter.classId = { $in: allowedClassIds };
    }

    // Fetch students with class info
    const students = await Student.find(studentFilter)
      .populate({ path: "classId", select: "name section teachers" })
      .lean() as any[];

    // Fetch StudentFee records for these students (new category-based)
    const studentIds = students.map((s) => s._id);
    const allStudentFees = await StudentFee.find({ studentId: { $in: studentIds } })
      .populate("categoryId", "name frequency dueDate")
      .lean() as any[];

    // Build per-student summary
    const studentFeeData = students.map((student: any) => {
      const fees = allStudentFees.filter(
        (f) => f.studentId.toString() === student._id.toString()
      );

      const totalDue = fees.reduce((s, f) => s + (f.totalAmount || 0), 0);
      const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
      const totalPending = Math.max(0, totalDue - totalPaid);

      // Category breakdown per student
      const categories = fees.map((f) => ({
        _id: f._id,
        categoryId: f.categoryId?._id || f.categoryId,
        categoryName: f.category,
        totalAmount: f.totalAmount,
        paidAmount: f.paidAmount,
        pendingAmount: Math.max(0, f.totalAmount - f.paidAmount),
        status: f.status,
        dueDate: f.dueDate,
        paymentMethod: f.paymentMethod || "",
        paymentNote: f.paymentNote || "",
        notificationSent: f.notificationSent,
      }));

      // Determine overall status
      let status: "paid" | "partial" | "due" = "due";
      if (totalDue > 0 && totalPending === 0) status = "paid";
      else if (totalPaid > 0 && totalPending > 0) status = "partial";

      return {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          admissionNo: student.admissionNo,
          classId: student.classId,
          dob: student.dob,
          gender: student.gender,
          parents: student.parents,
          medical: student.medical,
          photo: student.photo,
        },
        totalDue,
        totalPaid,
        totalPending,
        totalFine: 0,
        categories,
        status,
      };
    });

    // Class-level KPI: total students in this teacher's class (even those with no fees)
    const totalClassStudents = students.length;

    return NextResponse.json({
      success: true,
      students: studentFeeData,
      totalClassStudents,
    });
  } catch (error: any) {
    console.error("Error fetching student fee summary:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch student fee summary" },
      { status: 500 }
    );
  }
}
