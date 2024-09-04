import { Router } from "express";
import {
  adminlogin,
  refreshToken,
} from "../../controllers/admin/user.controller.js";

const router = Router();

router.post("/login", adminlogin);

router.post("/refreshToken", refreshToken);

export default router;
