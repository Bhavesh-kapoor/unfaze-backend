import mongoose, { Schema } from "mongoose";
 const sessionSchema = new Schema({
   enrolled_course_id:{
    type: Schema.Types.ObjectId,
    ref: "EnrolledCourse",
    required: true,
   },
    schedule_time:{
        type:String,
        required: true,
    }, 
    held_time:{
        type:String
    },
    duration:{
        type:String,
        required: true,
    },
    status:{
        type: String,
        enum: ["upcomming", "completed","expired"],
        default: "upcomming"
    } 
 })
 export const Session = mongoose.model("Session", sessionSchema);