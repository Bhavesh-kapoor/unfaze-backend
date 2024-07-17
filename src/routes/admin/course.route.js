import { Router } from "express";
import {
  createCourse,
  validateRegister,
  updateCourse,
  deleteCourse,
  findList,
} from "../../controllers/admin/courseControllers.js";
import verifyJwtToken from "../../middleware/admin/auth.middleware.js";
const courseRouter = Router();
courseRouter.post("/create", verifyJwtToken, validateRegister, createCourse);
courseRouter.post("/update", verifyJwtToken, validateRegister, updateCourse);
courseRouter.post("/delete", verifyJwtToken, deleteCourse);
courseRouter.post("/find-list", verifyJwtToken, findList);

export default courseRouter;
