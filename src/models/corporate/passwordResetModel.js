import mongoose from "mongoose";

const PasswordResetSchema =  new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: Number,
        required: true
    },
})