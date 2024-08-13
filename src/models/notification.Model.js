import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverType: { type: String, enum: ['User', 'Therapist'], required: true },
    message: { type: String, required: true },
    payload: { type: Map, of: String },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

 export const Notification = mongoose.model('Notification', notificationSchema);
