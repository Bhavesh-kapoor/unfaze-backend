import mongoose from "mongoose";

const SpecializationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }

}, { timestamps: true });



export const SpecializationModel = mongoose.model("Specialization", SpecializationSchema);