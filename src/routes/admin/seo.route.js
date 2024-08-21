import { Router } from "express";
import { createSeoData,updateSeoData,deleteSeoData,listSeoData,getSeoDataById,validateSeoData} from "../../controllers/admin/seoController.js";
const router = Router()

router.post("/create",validateSeoData,createSeoData)
router.patch("/update",updateSeoData)
router.delete("/delete",deleteSeoData)
router.get("/list-seo-data",listSeoData)
router.get("/list-seo-data",getSeoDataById)

export default router