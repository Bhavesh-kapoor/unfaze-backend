import mongoose from "mongoose";
import cron from "node-cron";
import { subMinutes } from "date-fns";
import { Transaction } from "../models/transactionModel.js";
import { Slot } from "../models/slotModal.js";


cron.schedule("*/10 * * * *", async () => {
    console.log("Running cron job to check processed slot...");

    try {
        const tenMinutesAgo = subMinutes(new Date(), 10);

        const transactions = await Transaction.find({
            payment_status: "PAYMENT_INITIATED",
            createdAt: { $lte: tenMinutesAgo },
        });
        let updatedCount = 0
        for (const transaction of transactions) {
            const slot = await Slot.findOne({
                "timeslots._id": transaction.slotId,
                "timeslots.isBooked": true,
            });
            if (slot) {
                // Find the specific timeslot to update
                const timeslot = slot.timeslots.id(transaction.slotId);

                if (timeslot && timeslot.isBooked) {
                    timeslot.isBooked = false;
                    await slot.save();
                    updatedCount++;
                }
            }
        }
        console.log("updatedSlotCount: " + updatedCount)
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});
