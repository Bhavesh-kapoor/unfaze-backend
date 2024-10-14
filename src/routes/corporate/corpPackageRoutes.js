import express from 'express';
import { createPackage, getPackage, updatePackage, deletePackage, getListOfPackages, allPackagesByOrg, validateRegister } from "../../controllers/corporate/packageController.js"

const router = express.Router();
router.post("/create", createPackage)
router.get("/get/:id", getPackage)
router.put("/update/:id", updatePackage)
router.delete("/delete/:id", deletePackage)
router.get("/get-list-org", allPackagesByOrg)
router.get("/get-all", getListOfPackages)
export default router;