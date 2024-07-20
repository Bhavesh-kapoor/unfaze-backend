import { Router } from "express";
const blogsrouter = Router();
import upload from "../../middleware/admin/multer.middleware.js";
import { createBlog, validateBlogs , getAllBlogs } from "../../controllers/admin/BlogsController.js";

blogsrouter.post('/create',upload.single('blogImage'),validateBlogs , createBlog);
blogsrouter.get('/all', getAllBlogs);


export default blogsrouter;