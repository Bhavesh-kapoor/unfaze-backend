import mongoose, { Schema } from "mongoose";

const enrolledCoure = new Schema({
   course_id:{
   type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
   },
   user_id:{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
   },
   payment_status:{
    type: Boolean,
    default: false,
   },
   transaction_id:{
    type:String,
    default:""
   },
   amount:{
    type:Number,
    default:0
   }
})

export const EnrolledCourse = mongoose.model("EnrolledCourse",enrolledCoure);