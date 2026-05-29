import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FeeCategory from "@/models/FeeCategory";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);
    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, amount, dueDate, frequency, active } = body;

    const category = await FeeCategory.findById(params.id);
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    // Teacher can only edit their own categories
    if (user.role === "teacher" && category.createdBy?.toString() !== user.id) {
      return NextResponse.json({ message: "You can only edit your own categories" }, { status: 403 });
    }

    const updated = await FeeCategory.findByIdAndUpdate(
      params.id,
      {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(frequency && { frequency }),
        ...(active !== undefined && { active }),
      },
      { new: true }
    );

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = verifyToken(token);
    if (!user || !["admin", "teacher"].includes(user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const category = await FeeCategory.findById(params.id);
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    if (user.role === "teacher" && category.createdBy?.toString() !== user.id) {
      return NextResponse.json({ message: "You can only delete your own categories" }, { status: 403 });
    }

    // Soft delete (mark inactive)
    await FeeCategory.findByIdAndUpdate(params.id, { active: false });

    return NextResponse.json({ success: true, message: "Fee category deactivated" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
