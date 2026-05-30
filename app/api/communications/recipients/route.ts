import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch all teachers (id, name, email)
    const teachers = await Teacher.find({}, { _id: 1, name: 1, email: 1 })
      .sort({ name: 1 })
      .lean();

    // Fetch all students and extract unique parents
    const students = await Student.find(
      { "parents.0": { $exists: true } },
      { parents: 1 }
    ).lean();

    // Deduplicate parents by email
    const parentMap = new Map<string, { name: string; email: string }>();
    for (const student of students) {
      if (!student.parents) continue;
      for (const parent of student.parents as any[]) {
        const email: string = parent.email?.trim();
        if (email && !parentMap.has(email)) {
          parentMap.set(email, {
            name: parent.name || "Parent",
            email,
          });
        }
      }
    }

    const parents = Array.from(parentMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({
      success: true,
      teachers: teachers.map((t: any) => ({
        _id: String(t._id),
        name: t.name,
        email: t.email,
      })),
      parents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching recipients", error: error.message },
      { status: 500 }
    );
  }
}
