import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // Key-value map: userId string -> unread count (e.g. { "6acb...": 2 })
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      previewText: {
        type: String,
        maxlength: 80,
        default: "",
      },
      type: {
        type: String,
        enum: ["text", "img", "file", "voice"],
        default: "text",
      },
      status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    activeBucketSeq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for ultra-fast denormalized inbox loading:
conversationSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);

