import express from 'express';
import { therapistList, therapistDetails, therapistListByGroup, findBolgbySlug } from "../controllers/public/public.controller.js"
import { getAllBlogs } from "../controllers/admin/BlogsController.js"
import { getAllSpecialization } from "../controllers/admin/SpecilizationController.js"
import contactUsRoutes from "../routes/contactUs.router.js"

const publicRouter = express.Router();

publicRouter.get("/get-therapist-list", therapistList);
publicRouter.get("/get-therapist-list-by-category", therapistListByGroup);
publicRouter.get("/get-blog-list", getAllBlogs);
publicRouter.get("/get-blog-details", findBolgbySlug);
publicRouter.get("/get-services-list", getAllSpecialization);
publicRouter.get("/therapist-details/:slug", therapistDetails);
publicRouter.use("/contact-us", contactUsRoutes);

export default publicRouter;