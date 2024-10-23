import express from "express";
import {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOfferById,
  deleteOfferById,
  availableCoupons,
  sendMessageToWhatsapp,
} from "../controllers/offerController.js";

const router = express.Router();

// Create a new offer
router.post("/create", createOffer);

// Get all offers
router.get("/all", getAllOffers);

// Get all offers
router.get("/available-coupons", availableCoupons);

// Get all offers
router.get("/send-offer/:id", sendMessageToWhatsapp);

// Get offers by ID
router.get("/get/:id", getOfferById);

// Update offers by ID
router.put("/update/:id", updateOfferById);

// Delete offers by ID
router.delete("/delete/:id", deleteOfferById);

export default router;
