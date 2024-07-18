import mongoose, { Schema, Types } from "mongoose";

const BlogSchema = new mongoose.Schema(
    {
    title: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    blogImage: {
        type: String,
        required: true,
        trim: true
    }
    ,
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }
}, { timestamps: true });

 const   Blog =  mongoose.model('blog',BlogSchema);

 export  default Blog;