import mongoose from "mongoose";

const CommunicationLogSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipients: {
      type: [String], // Array of email addresses or user roles
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Sent", "Failed", "Pending"],
      default: "Pending",
    },
    attachments: [
      {
        filename: String,
        url: String, // URL to cloud storage (e.g. Cloudinary)
      }
    ],
  },
  { timestamps: true }
);

const CommunicationLog = mongoose.models.CommunicationLog || mongoose.model("CommunicationLog", CommunicationLogSchema);

export default CommunicationLog;
