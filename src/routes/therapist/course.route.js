import { Router } from "express";
import {
  createCourse,
  validateInput,
  updateCourse,
  deleteCourse,
  findList,
} from "../../controllers/courseControllers.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
const courseRouter = Router();
courseRouter.post("/create", verifyJwtToken, validateInput, createCourse);
courseRouter.put("/update/:_id", verifyJwtToken, validateInput, updateCourse);
courseRouter.delete("/delete/:_id", verifyJwtToken, deleteCourse);
courseRouter.get("/course_list", verifyJwtToken, findList);

export default courseRouter;
