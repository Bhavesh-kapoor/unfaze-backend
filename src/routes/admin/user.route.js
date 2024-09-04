import { Router } from "express";
import { allUser } from "../../controllers/admin/user.controller.js";

const router = Router();

router.get("/user-list", allUser);

export default router;
