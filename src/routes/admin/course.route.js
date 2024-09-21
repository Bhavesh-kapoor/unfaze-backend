import { Router } from "express";
import {
  createCourse,
  validateInput,
  updateCourse,
  deleteCourse,
  findById,
  findList,
} from "../../controllers/courseControllers.js";

const courseRouter = Router();

courseRouter.post("/create", validateInput, createCourse);

courseRouter.put("/update/:_id", updateCourse);

courseRouter.delete("/delete/:_id", deleteCourse);

courseRouter.get("/course_list", findList);

courseRouter.get("/get/:_id", findById);

export default courseRouter;
