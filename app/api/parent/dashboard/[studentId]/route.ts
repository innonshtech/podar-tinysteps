import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/Student";
import Attendance from "@/models/Attendance";
import StudentFee from "@/models/StudentFee";
import Event from "@/models/Event";
import Notification from "@/models/Notification";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  try {
    await connectDB();
    const { studentId } = await context.params;

    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the student
    const student = await Student.findById(studentId).lean();
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    // Ensure the parent is allowed to view this student's data
    if (user.role === "parent") {
      // The login route sets user.id to the student._id when role is parent
      if (user.id !== studentId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch Attendance (Last 30 days summary or all)
    const attendance = await Attendance.find({ studentId }).sort({ date: -1 }).limit(30).lean();

    // Fetch Fees
    const fees = await StudentFee.find({ studentId }).lean();

    // Fetch Events (Upcoming)
    const events = await Event.find({
      $or: [{ classIds: student.classId }, { targetAudience: "all" }, { targetAudience: "parents" }, { targetAudience: "students" }]
    }).sort({ startDate: 1 }).limit(10).lean();

    // Fetch Notifications for parents
    const notifications = await Notification.find({
      $or: [{ targetAudience: "all" }, { targetAudience: "parents" }]
    }).sort({ createdAt: -1 }).limit(10).lean();

    return NextResponse.json({
      success: true,
      data: {
        student,
        attendance,
        fees,
        events,
        notifications,
        // homework can be added here once the model is created
        homework: []
      }
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
