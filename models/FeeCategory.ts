import mongoose from "mongoose";

const FeeCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Uniform Fee", "Annual Day Fee"
    description: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true, // Each category belongs to a specific class
    },
    dueDate: { type: Date, required: true },
    frequency: {
      type: String,
      enum: ["one-time", "monthly", "quarterly", "yearly"],
      default: "one-time",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      // Could be Teacher or User (admin)
    },
    createdByRole: { type: String, enum: ["teacher", "admin"], default: "teacher" },
    active: { type: Boolean, default: true },
    notificationsCount: { type: Number, default: 0 }, // How many parent notifications were sent
  },
  { timestamps: true }
);

delete mongoose.models.FeeCategory;
export default mongoose.models.FeeCategory || mongoose.model("FeeCategory", FeeCategorySchema);
