import express from 'express';
import { therapistList, therapistListByGroup } from "../controllers/public/public.controller.js"
import { getAllBlogs } from "../controllers/admin/BlogsController.js"
import { getAllSpecialization } from "../controllers/admin/SpecilizationController.js"

const publicRouter = express.Router();

publicRouter.get("/get-therapist-list", therapistList);
publicRouter.get("/get-therapist-list-by-category", therapistListByGroup);
publicRouter.get("/get-blog-list", getAllBlogs);
publicRouter.get("/get-services-list", getAllSpecialization);

export default publicRouter