import { Router } from "express";
import {
  createBlog,
  deleteBolg,
  updateBlog,
  getAllBlogs,
  findBolgById,
} from "../../controllers/admin/BlogsController.js";
import { upload, compressImage } from "../../middleware/admin/multer.middleware.js";

const router = Router();

router.get("/all", getAllBlogs);

router.delete("/delete/:_id", deleteBolg);

router.get("/get-blog/:_id", findBolgById);

router.post("/create", upload.single("blogImageUrl"), compressImage, createBlog);

router.put("/update/:_id", upload.single("blogImageUrl"), compressImage, updateBlog);

export default router;
