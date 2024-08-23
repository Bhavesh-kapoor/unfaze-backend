import mongoose from "mongoose";

const FaqSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true
    },
    question: {
        type: String,
        trime: true,
        required: true,

    },
    answer :{
        type : String,
        trim :  true,
        required : true,
    }
    ,
    is_active : {
        type : Number,
        enum : [0,1], // here  0 is not active and 1 is active 
        required :  true ,
        default : 0
    }

}, { timestamps: true });

export const  Faq = mongoose.model('Faq',FaqSchema);