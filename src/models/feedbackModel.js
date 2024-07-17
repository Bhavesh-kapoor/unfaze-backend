import mongoose, { Schema } from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        therepist_id: {
            type: Schema.Types.ObjectId,
            ref: "TherepisetModel"
        },
        star: {
            type: String,
            default: 0,
        },
        feedback: {
            type: String,
            required: true,
            trim: true
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

    }, { timestamps: true })

const  Feedback =  mongoose.model('feeback', feedbackSchema);

export default Feedback;
