import { Router } from "express";
import seoRouter from "./seo.route.js";
import faqRouter from "./faq.route.js";
import blogsRouter from "./blogs.route.js";
import userRoutes from "../admin/user.route.js";
import feedbackRoute from "../feeback.route.js";
import therapistRouter from "./therepist.auth.js";
import courseRouter from "../admin/course.route.js";
import categoryRouter from "./blogCategory.route.js";
import transactionRoutes from "./transaction.route.js";
import dashboardRoutes from "../admin/dashboardRoutes.js";
import specializationRouter from "./specilization.route.js";
import contactUsRoutes from "../../routes/contactUs.router.js";
import { setNewPasswrd } from "../../controllers/admin/user.controller.js";
import { getAllConversationList, getChatHistoryForAdmin } from "../../controllers/messageController.js";
import monetizeRoutes from "./therapistPayRoutes.js"
import {
  getUserSessions,
  bookSessionManully,
  getTherapistSession,
  sessionCompleted,
  manualSessionBooking
} from "../../controllers/admin/sessionsControllers.js";
import coupenRoute from "./coupon.route.js";
import corpUserRoute from "../corporate/corpUserRoutes.js"
import organizationRoute from "../corporate/organizationRoutes.js"
import corpPackageRoute from "../corporate/corpPackageRoutes.js"

const router = Router();

router.use("/seo", seoRouter);

router.use("/faq", faqRouter);

router.use("/user", userRoutes);

router.use("/blogs", blogsRouter);

router.use("/course", courseRouter);

router.use("/feedback", feedbackRoute);

router.use("/therapist", therapistRouter);

router.use("/dashboard", dashboardRoutes);

router.use("/contact-us", contactUsRoutes);

router.use("/blog-category", categoryRouter);

router.use("/transactions", transactionRoutes);

router.put("/set-new-password", setNewPasswrd);

router.use("/specialization", specializationRouter);

router.post("/book-session-manully", bookSessionManully);
router.get("/user-sessions/:userId", getUserSessions);

router.get("/therapist-sessions/:Id", getTherapistSession);
router.get("/get-chat-list", getAllConversationList);
router.get("/get-chat-history/:chatId", getChatHistoryForAdmin);
router.use('/coupon', coupenRoute);
router.get('/session_completed/:sessionId', sessionCompleted);
router.post('/manual-booking', manualSessionBooking);
router.use('/monetize', monetizeRoutes);

/*------------------------------------- CORPORATE ROUTE------------------------------------- */
router.use('/corporate', corpUserRoute);
router.use('/organization', organizationRoute);
router.use('/corp-package', corpPackageRoute);


export default router;
