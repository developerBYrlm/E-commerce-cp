import mongoose from "mongoose";

const messageSubSchema = new mongoose.Schema(
  {
    s: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // senderId
    c: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    }, // content (string or compressed Buffer if > 400 chars)
    t: {
      type: String,
      enum: ["text", "img", "file", "voice"],
      default: "text",
    }, // type
    st: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    }, // status
    ts: {
      type: Date,
      default: Date.now,
    }, // timestamp
    m: {
      type: mongoose.Schema.Types.Mixed,
    }, // optional metadata (url, size, fileName, etc.)
  },
  { _id: true }
);

const messageBucketSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    bucketSeq: {
      type: Number,
      required: true,
      default: 0,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 50,
    },
    isCompressed: {
      type: Boolean,
      default: false,
    },
    compressedPayload: {
      type: Buffer,
    },
    messages: [messageSubSchema],
  },
  {
    timestamps: true,
  }
);

messageBucketSchema.index({ conversationId: 1, bucketSeq: -1 });

export default mongoose.model("MessageBucket", messageBucketSchema);

