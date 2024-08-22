import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        maxlength: 15, 
        minlength: 2   
    }
},{timestamps:true});

const Category = mongoose.model('Category', CategorySchema);

export default Category;