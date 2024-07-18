import { Router } from "express";
const blogsrouter = Router();
import upload from "../../middleware/admin/multer.middleware.js";
import { createBlog, validateBlogs } from "../../controllers/admin/BlogsController.js";

blogsrouter.post('/create',upload.single('blogImage'),validateBlogs , createBlog)


export default blogsrouter;