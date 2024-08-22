import { Router } from "express";
const blogsrouter = Router();
import upload from "../../middleware/admin/multer.middleware.js";
import {
  createBlog,
  validateBlogs,
  getAllBlogs,
  updateBlog,
  deleteBolg,
  findBolgById,
} from "../../controllers/admin/BlogsController.js";
import isAdmin from "../../middleware/admin/isAdmin.js";

blogsrouter.post(
  "/create",
  upload.single("imageUrl"),
  validateBlogs,
  isAdmin,
  createBlog
);
blogsrouter.put(
  "/update/:_id",
  upload.single("imageUrl"),
  validateBlogs,
  isAdmin,
  updateBlog
);
blogsrouter.delete("/delete/:_id", isAdmin, deleteBolg);
blogsrouter.get("/all", getAllBlogs);
blogsrouter.get("/get-blog/:_id", findBolgById);

export default blogsrouter;
