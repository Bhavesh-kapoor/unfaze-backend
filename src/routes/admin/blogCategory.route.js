import { Router } from "express";
import { createBlogCategory,allBlogCategory } from "../../controllers/admin/CategoryController.js";
const categoryRouter = Router();


categoryRouter.post('/create' ,createBlogCategory);
categoryRouter.post('/all' ,allBlogCategory);

export default categoryRouter;