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
        type : Boolean,
        required :  true ,
        default : true
    }

}, { timestamps: true });

export const  Faq = mongoose.model('Faq',FaqSchema);