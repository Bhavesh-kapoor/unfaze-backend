import mongoose from "mongoose";
import cron from "node-cron";
import { subMinutes } from "date-fns";
import { Session } from "../models/sessionsModel.js";

cron.schedule("*/15 * * * *", async () => {
    try {
        const now = new Date();
        const thresholdTime = subMinutes(now, 5);

        const missedSessions = await Session.updateMany(
            {
                end_time: { $lt: thresholdTime }, // Session end time is in the past
                status: { $nin: ["completed", "cancelled", "missed"] } // Status is not one of these values
            },
            { $set: { status: "missed" } }
        );
        console.log(`Updated ${missedSessions.modifiedCount} sessions to 'missed' status.`);
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});
