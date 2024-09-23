import mongoose from 'mongoose';

const EnrolledcourseSchema = new mongoose.Schema({
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Therapist',
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    remainingSessions: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
    }
})
export const EnrolledCourse = mongoose.model('EnrolledCourse', EnrolledcourseSchema);