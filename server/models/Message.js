import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  text: { type: String, maxlength: 5000, default: "" }, attachment: String, seenAt: Date,
}, { timestamps: true });
export default mongoose.model("Message", messageSchema);
