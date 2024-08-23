import {Router} from "express";
import { raiseQuery,changeQueryStatus,getQueryList } from "../controllers/admin/contactUsController.js";

const router = Router();

router.post("/raise-query",raiseQuery)
router.patch("/update-status/:_id",changeQueryStatus)
router.get("/query-list",getQueryList)
export default router;