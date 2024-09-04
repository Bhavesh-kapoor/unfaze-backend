import { Router } from "express";
import {
  createBlogCategory,
  allBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
} from "../../controllers/admin/blogCategoryController.js";

const router = Router();

router.get("/all", allBlogCategory);

router.post("/create", createBlogCategory);

router.put("/update/:_id", updateBlogCategory);

router.delete("/delete/:_id", deleteBlogCategory);

export default router;
