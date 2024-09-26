import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
    },
    senderId: {
      type: String,
    },
    text: {
      type: String,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', "read"],
      default: 'sent'
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", MessageSchema);