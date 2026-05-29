import mongoose from "mongoose";

const CommunicationLogSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    from: {
      type: String,
      default: "",
    },
    recipientType: {
      type: String,
      enum: ["single", "teachers", "parents", "all_teachers", "all_parents", "mixed"],
      default: "single",
    },
    // Actual email addresses the mail was dispatched to
    recipientEmails: {
      type: [String],
      required: true,
    },
    // Human-readable labels (names) for display in the history panel
    recipientLabels: {
      type: [String],
      default: [],
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
      enum: ["Sent", "Partial", "Failed", "Pending"],
      default: "Pending",
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        filename: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

const CommunicationLog =
  mongoose.models.CommunicationLog ||
  mongoose.model("CommunicationLog", CommunicationLogSchema);

export default CommunicationLog;
