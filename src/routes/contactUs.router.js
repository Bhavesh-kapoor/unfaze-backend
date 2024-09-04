import { Router } from "express";
import {
  getQueryList,
  changeQueryStatus,
} from "../controllers/admin/contactUsController.js";

const router = Router();

router.get("/query-list", getQueryList);

router.patch("/update-status/:_id", changeQueryStatus);

export default router;
