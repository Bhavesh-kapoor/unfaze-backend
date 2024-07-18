import mongoose, { Schema } from "mongoose";
 const sessionSchema = new Schema({
    user_id:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    therapist_id:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    schedule_time:{
        type:String,
        required: true,
    }, 
    cost:{
        type:Number
    },
    duration:{
        type:String,
        required: true,
    },
    status:{
        type: String,
        enum: ["upcomming", "completed"],
        default: "upcomming"
    } 
 })
 export const Session = mongoose.model("Session", sessionSchema);