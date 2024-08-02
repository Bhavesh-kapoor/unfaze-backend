import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    categoryname: {
        type: String,
        trim: true,
        required: true
    }
},);

const Category = mongoose.model('category', CategorySchema);

export default Category;