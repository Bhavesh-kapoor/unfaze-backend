import { Router } from "express";
import { createBlogCategory,allBlogCategory,updateBlogCategory,deleteBlogCategory } from "../../controllers/admin/CategoryController.js";
const categoryRouter = Router();


categoryRouter.post('/create' ,createBlogCategory);
categoryRouter.get('/all' ,allBlogCategory);
categoryRouter.put('/update/:_id' ,updateBlogCategory);
categoryRouter.delete('/delete/:_id' ,deleteBlogCategory);

export default categoryRouter;