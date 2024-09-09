import Category from "../../models/categoryModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import mongoose from "mongoose";

const allBlogCategory = asyncHandler(async (req, res) => {
  const getAllCategory = await Category.find().sort({ _id: -1 });
  res
    .status(200)
    .json(new ApiResponse(200, getAllCategory, "Category Found Successfull!"));
});

const createBlogCategory = asyncHandler(async (req, res) => {
  let { name } = req.body;
  name = name.toLowerCase().trim();
  if (!name) {
    return res
      .status(401)
      .json(new ApiError(401, "", "Blog Category Name is required"));
  }
  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res
        .status(403)
        .json(new ApiError(403, "", "category already exist!"));
    }
    const category = await Category.create({ name });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          category,
          "Blog Category has been created Successfully!"
        )
      );
  } catch (err) {
    res.status(500).json(new ApiError(500, "", err));
  }
});
const updateBlogCategory = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { name } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json(new ApiError(400, "", "Invalid category id"));
  }

  if (!name) {
    return res
      .status(400)
      .json(new ApiError(400, "Category name is required!"));
  }

  const category = await Category.findByIdAndUpdate(
    _id,
    { name },
    { new: true, runValidators: true }
  );
  if (!category) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Error while updating the category"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, category, "category updated successfully! "));
});

const deleteBlogCategory = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json(new ApiError(400, "", "Invalid category id"));
  }
  const deletedBlogCategory = await Category.findByIdAndDelete(_id);
  if (!deletedBlogCategory) {
    return res.status(404).json(new ApiError(404, "", "invalid category!"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "", "Blog category deleted successfully"));
});

export {
  createBlogCategory,
  allBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
};
