import mongoose from "mongoose";

const EnquirySchema = new mongoose.Schema(
  {
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    childName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    interestedClass: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["New", "Follow-up Pending", "Converted", "Rejected"],
      default: "New",
    },
    followUpDate: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

const Enquiry = mongoose.models.Enquiry || mongoose.model("Enquiry", EnquirySchema);

export default Enquiry;
