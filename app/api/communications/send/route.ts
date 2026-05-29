import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CommunicationLog from "@/models/CommunicationLog";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      sendMode,       // "single" | "teachers" | "parents" | "all_teachers" | "all_parents"
      customEmail,    // used when sendMode === "single"
      selectedTeacherIds,   // string[] — used when sendMode === "teachers"
      selectedParentEmails, // string[] — used when sendMode === "parents"
      subject,
      body,
    } = await req.json();

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json(
        { message: "Subject and body are required" },
        { status: 400 }
      );
    }

    // ── Resolve recipient email list ─────────────────────────────────
    let recipientEmails: string[] = [];
    let recipientLabels: string[] = [];
    let recipientType: string = sendMode || "single";

    if (sendMode === "single") {
      if (!customEmail?.trim()) {
        return NextResponse.json(
          { message: "Email address is required for single send" },
          { status: 400 }
        );
      }
      recipientEmails = [customEmail.trim()];
      recipientLabels = [customEmail.trim()];

    } else if (sendMode === "teachers") {
      if (!selectedTeacherIds || selectedTeacherIds.length === 0) {
        return NextResponse.json(
          { message: "Select at least one teacher" },
          { status: 400 }
        );
      }
      const teachers = await Teacher.find(
        { _id: { $in: selectedTeacherIds } },
        { name: 1, email: 1 }
      ).lean();

      for (const t of teachers as any[]) {
        if (t.email) {
          recipientEmails.push(t.email);
          recipientLabels.push(t.name || t.email);
        }
      }

    } else if (sendMode === "parents") {
      if (!selectedParentEmails || selectedParentEmails.length === 0) {
        return NextResponse.json(
          { message: "Select at least one parent" },
          { status: 400 }
        );
      }
      recipientEmails = selectedParentEmails.filter(Boolean);
      recipientLabels = selectedParentEmails.filter(Boolean);

    } else if (sendMode === "all_teachers") {
      const teachers = await Teacher.find({}, { name: 1, email: 1 }).lean();
      for (const t of teachers as any[]) {
        if (t.email) {
          recipientEmails.push(t.email);
          recipientLabels.push(t.name || t.email);
        }
      }

    } else if (sendMode === "all_parents") {
      const students = await Student.find(
        { "parents.0": { $exists: true } },
        { parents: 1 }
      ).lean();
      const seen = new Set<string>();
      for (const student of students) {
        if (!student.parents) continue;
        for (const parent of student.parents as any[]) {
          const email: string = parent.email?.trim();
          if (email && !seen.has(email)) {
            seen.add(email);
            recipientEmails.push(email);
            recipientLabels.push(parent.name || email);
          }
        }
      }

    } else {
      return NextResponse.json(
        { message: "Invalid sendMode. Use: single | teachers | parents | all_teachers | all_parents" },
        { status: 400 }
      );
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { message: "No valid email addresses found for the selected recipients" },
        { status: 400 }
      );
    }

    // ── Send the email via SMTP ─────────────────────────────────────
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "";

    const result = await sendEmail({
      to: recipientEmails,
      subject: subject.trim(),
      html: body,
    });

    const status = result.success ? "Sent" : "Failed";
    const sentCount = result.success ? recipientEmails.length : 0;
    const failedCount = result.success ? 0 : recipientEmails.length;

    // ── Save communication log ──────────────────────────────────────
    const log = await CommunicationLog.create({
      sender: user.id,
      from: fromAddress,
      recipientType,
      recipientEmails,
      recipientLabels,
      subject: subject.trim(),
      body,
      status,
      sentCount,
      failedCount,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Failed to send email",
          error: result.error,
          log,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: `Email sent successfully to ${sentCount} recipient${sentCount !== 1 ? "s" : ""}`,
        sentCount,
        log,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Communications send error:", error);
    return NextResponse.json(
      { message: "Error sending communication", error: error.message },
      { status: 500 }
    );
  }
}
