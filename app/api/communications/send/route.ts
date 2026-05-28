import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CommunicationLog from "@/models/CommunicationLog";
import { verifyToken } from "@/lib/auth";

// Dummy email sender utility to stub out actual email sending for now
const sendEmail = async (recipients: string[], subject: string, body: string) => {
  console.log(`[Email Stub] Sending email to: ${recipients.join(", ")}`);
  console.log(`[Email Stub] Subject: ${subject}`);
  // return Promise.resolve(true); // Simulate success
  return true;
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { recipients, subject, body } = await req.json();

    if (!recipients || recipients.length === 0 || !subject || !body) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Attempt to send email
    const emailSuccess = await sendEmail(recipients, subject, body);

    const newLog = new CommunicationLog({
      sender: user.id,
      recipients,
      subject,
      body,
      status: emailSuccess ? "Sent" : "Failed",
    });

    await newLog.save();

    if (!emailSuccess) {
       return NextResponse.json({ message: "Failed to send email to some recipients", log: newLog }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Communication sent successfully", log: newLog },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error sending communication", error: error.message },
      { status: 500 }
    );
  }
}
