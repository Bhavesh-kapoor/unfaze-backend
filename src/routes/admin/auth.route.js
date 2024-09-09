import { Router } from "express";
import seoRouter from "./seo.route.js";
import faqRouter from "./faq.route.js";
import blogsRouter from "./blogs.route.js";
import userRoutes from "../admin/user.route.js";
import feedbackRoute from "../feeback.route.js";
import therapistRouter from "./therepist.auth.js";
import categoryRouter from "./blogCategory.route.js";
import transactionRoutes from "./transaction.route.js";
import specializationRouter from "./specilization.route.js";
import contactUsRoutes from "../../routes/contactUs.router.js";
import dashboardRoutes from "../admin/dashboardRoutes.js"

const router = Router();

router.use("/seo", seoRouter);

router.use("/faq", faqRouter);

router.use("/user", userRoutes);

router.use("/blogs", blogsRouter);

router.use("/feedback", feedbackRoute);

router.use("/therapist", therapistRouter);

router.use("/contact-us", contactUsRoutes);

router.use("/blog-category", categoryRouter);

router.use("/transactions", transactionRoutes);

router.use("/specialization", specializationRouter);
router.use("/dashboard", dashboardRoutes);


export default router;
