import Blog from "../../models/blogsModel.js";
import { check, validationResult } from "express-validator";
import AysncHandler from "../../utils/AysncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import mongoose from "mongoose";

const validateBlogs = [
    check('title', "Blog title is required!").notEmpty(),
    check('description', "Blog Description is required!").notEmpty(),
    check('categoryId', "CategoryId  is required!").notEmpty(),
    check('userId', "userId  is required!").notEmpty(),
    check('blogImage', "Image  is required!").notEmpty(),
]


const createBlog = AysncHandler(async (req, res) => {
    const errors = validationResult(req);
    console.log(req.body);

    if (!errors.isEmpty()) {
        res.status(400).json(new ApiError(400, "Validation Error", errors.array()));
    } else {
        const { title, description, categoryId, userId } = req.body;
        const BlogData = { title, description, categoryId, userId };
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json(new ApiError(400, "", "Invalid User id"));
        } else {
            if (req.file?.blogImage) {
                BlogData.blogImage = req.file.blogImage[0].path;
            }
            // now save the data
            await Blog.create(BlogData);
            res.staus(200).json(new ApiResponse(200, "", "Blogs created Successfully!"));

        }
    }




});

export { validateBlogs, createBlog };