import mongoose from "mongoose";
import cron from "node-cron";
import { subMinutes } from "date-fns";
import { Session } from "../models/sessionsModel.js";
cron.schedule("*/15 * * * *", async () => {
    console.log("Running cron job to check for missed sessions...");
    try {
        const now = new Date();
        const thresholdTime = subMinutes(now, 5);

        
        const missedSessions = await Session.updateMany(
            {
                end_time: { $lt: thresholdTime },
                status: { $ne: "completed", $ne: "cancelled", $ne: "missed" }
            },
            { $set: { status: "missed" } }
        );
        // console.log(`Updated ${missedSessions.modifiedCount} sessions to 'missed' status.`);
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});
