import { Router } from "express";
import { getTemplateMessage } from "../controllers/wattiWebhookController.js";

const WattiWebhookRoute = Router();

WattiWebhookRoute.post("/get-feedback-rating", getTemplateMessage);

export default WattiWebhookRoute;
