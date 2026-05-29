import mongoose from "mongoose";

const StudentFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    // New: link to a FeeCategory (extra fees)
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeCategory",
      default: null,
    },
    // New: the class this fee belongs to (for teacher-scoped queries)
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    // New: who created / assigned this fee
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    category: {
      type: String, // e.g., "Uniform Fee", "Books", "Activity Fee"
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Unpaid", "Partial", "Paid"],
      default: "Unpaid",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
    },
    // New: track whether parent notification was sent
    notificationSent: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Net Banking", "Cheque", "Card", ""],
      default: "",
    },
    paymentNote: { type: String, default: "" },
  },
  { timestamps: true }
);

// Virtual for calculating pending amount
StudentFeeSchema.virtual("pendingAmount").get(function () {
  return Math.max(0, this.totalAmount - this.paidAmount);
});

delete mongoose.models.StudentFee;
const StudentFee =
  mongoose.models.StudentFee || mongoose.model("StudentFee", StudentFeeSchema);

export default StudentFee;
