import mongoose from "mongoose";

const StudentFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
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
  },
  { timestamps: true }
);

// Virtual for calculating pending amount
StudentFeeSchema.virtual('pendingAmount').get(function() {
  return this.totalAmount - this.paidAmount;
});

const StudentFee = mongoose.models.StudentFee || mongoose.model("StudentFee", StudentFeeSchema);

export default StudentFee;
