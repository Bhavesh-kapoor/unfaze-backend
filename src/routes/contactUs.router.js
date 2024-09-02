import {Router} from "express";
import { raiseQuery,changeQueryStatus,getQueryList } from "../controllers/admin/contactUsController.js";
import isAdmin from "../middleware/admin/isAdmin.js";

const router = Router();

router.post("/raise-query",raiseQuery)
router.patch("/update-status/:_id",isAdmin, changeQueryStatus)
router.get("/query-list", isAdmin, getQueryList)
export default router;