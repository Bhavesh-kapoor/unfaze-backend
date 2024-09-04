import { Router } from "express";
import upload from "../../middleware/admin/multer.middleware.js";
import {
  createBlog,
  deleteBolg,
  updateBlog,
  getAllBlogs,
  findBolgById,
  validateBlogs,
} from "../../controllers/admin/BlogsController.js";

const router = Router();

router.post("/create", upload.single("imageUrl"), validateBlogs, createBlog);

router.put(
  "/update/:_id",
  upload.single("imageUrl"),
  validateBlogs,
  updateBlog
);

router.get("/all", getAllBlogs);

router.delete("/delete/:_id", deleteBolg);

router.get("/get-blog/:_id", findBolgById);

export default router;
