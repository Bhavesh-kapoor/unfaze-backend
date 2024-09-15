import { Router } from "express";
import {
  getQueryList,
  getQueryById,
  changeQueryStatus,
} from "../controllers/admin/contactUsController.js";

const router = Router();

router.get("/query-list", getQueryList);

router.get("/edit/:_id", getQueryById);

router.put("/update-status/:_id", changeQueryStatus);

export default router;
