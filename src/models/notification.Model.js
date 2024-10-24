import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverType: { type: String, enum: ['User', 'Therapist'], required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['general', 'appointment', 'chat'],
        default: 'general'
    },
    payload: { type: Map, of: String },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
