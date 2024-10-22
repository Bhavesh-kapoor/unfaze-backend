import mongoose from "mongoose";
import cron from "node-cron";
import { subMinutes } from "date-fns";
import chalk from "chalk"; // Import chalk
import { Slot } from "../models/slotModal.js";
import { Transaction } from "../models/transactionModel.js";

// Cron job to run every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  const currentTime = new Date().toISOString();
  console.log(
    chalk.blue(
      `[Cron Job Started] Checking unprocessed slots. Time: ${currentTime}`
    )
  );

  try {
    const tenMinutesAgo = subMinutes(new Date(), 10);

    // Find transactions where payment is not successful, older than 10 minutes, and manuallyBooked is false
    const transactions = await Transaction.find({
      payment_status: { $ne: "SUCCESSFUL" },
      createdAt: { $lte: tenMinutesAgo },
      manuallyBooked: false,
    });

    let updatedCount = 0;

    if (transactions.length > 0) {
      console.log(
        chalk.yellow(
          `[Cron Job] Found ${transactions.length} transactions to check.`
        )
      );

      // Loop through transactions and update the slot status if it's booked
      for (const transaction of transactions) {
        try {
          const slot = await Slot.findOne({
            "timeslots._id": transaction.slotId,
            "timeslots.isBooked": true, // Only consider slots that are marked as booked
          });

          if (slot) {
            // Find the specific timeslot to update
            const timeslot = slot.timeslots.id(transaction.slotId);

            if (timeslot && timeslot.isBooked) {
              timeslot.isBooked = false;
              await slot.save();
              updatedCount++;
              console.log(
                chalk.green(
                  `[Cron Job] Slot ${transaction.slotId} is now marked as available.`
                )
              );
            }
          } else {
            console.log(
              chalk.red(
                `[Cron Job] Slot not found or already unbooked for transaction ${transaction._id}.`
              )
            );
          }
        } catch (slotError) {
          console.error(
            chalk.red(
              `[Error] Processing slot for transaction ${transaction._id}:`
            ),
            slotError
          );
        }
      }
    } else {
      console.log(
        chalk.gray("[Cron Job] No transactions found that meet the criteria.")
      );
    }

    console.log(chalk.blue(`[Cron Job] Total slots updated: ${updatedCount}`));
  } catch (error) {
    console.error(chalk.red("[Error] in cron job execution:"), error);
  } finally {
    console.log(
      chalk.blue(`[Cron Job Ended] Time: ${new Date().toISOString()}`)
    );
  }
});
