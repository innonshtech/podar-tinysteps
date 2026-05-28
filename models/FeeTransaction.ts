import mongoose from "mongoose";

const FeeTransactionSchema = new mongoose.Schema(
  {
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String, // e.g., "Cash", "UPI", "Net Banking", "Card"
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    referenceNumber: {
      type: String, // For UPI/Bank transaction IDs
    },
    status: {
      type: String,
      enum: ["Success", "Pending", "Failed"],
      default: "Success",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The teacher or admin who recorded the payment
      required: true,
    },
  },
  { timestamps: true }
);

const FeeTransaction = mongoose.models.FeeTransaction || mongoose.model("FeeTransaction", FeeTransactionSchema);

export default FeeTransaction;
