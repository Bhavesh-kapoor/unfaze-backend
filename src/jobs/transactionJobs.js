import mongoose from "mongoose";
import cron from "node-cron";
import { subMinutes } from "date-fns";
import chalk from "chalk"; // Import chalk
import { Slot } from "../models/slotModal.js";
import { Transaction } from "../models/transactionModel.js";

// Cron job to run every 10 minutes
cron.schedule("*/5 * * * *", async () => {
  const currentTime = new Date().toISOString();
  console.log(
    chalk.blue(
      `[Cron Job Started] Checking unprocessed slots. Time: ${currentTime}`
    )
  );

  try {
    const tenMinutesAgo = subMinutes(new Date(currentTime), 5);
    const twelveMinutesAgo = subMinutes(new Date(currentTime), 10);
    // Find transactions where payment is not successful, older than 10 minutes, and manuallyBooked is false
    const transactions = await Transaction.find({
      payment_status: { $ne: "successful" },
      createdAt: { $gte: twelveMinutesAgo, $lte: tenMinutesAgo },
    });
    let updatedCount = 0;
    if (transactions.length > 0) {
      console.log(
        chalk.yellow(
          `[Cron Job - [TRANSACTION JOB]] Found ${transactions.length} transactions to check.`
        )
      );
      // Loop through transactions and update the slot status if it's booked
      for (const transaction of transactions) {
        try {
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
              console.log(
                chalk.green(
                  `[Cron Job - [TRANSACTION JOB]] Slot ${transaction.slotId} is now marked as available.`
                )
              );
            }
          } else {
            console.log(
              chalk.red(
                `[Cron Job - [TRANSACTION JOB]] Slot not found or already unbooked for transaction ${transaction._id}.`
              )
            );
          }
        } catch (slotError) {
          console.error(
            chalk.red(
              `[Error] [TRANSACTION JOB] Processing slot for transaction ${transaction._id}:`
            ),
            slotError
          );
        }
      }
    } else {
      console.log(
        chalk.gray(
          "[Cron Job - [TRANSACTION JOB]] No transactions found that meet the criteria."
        )
      );
    }

    console.log(
      chalk.blue(
        `[Cron Job - [TRANSACTION JOB]] Total slots updated: ${updatedCount}`
      )
    );
  } catch (error) {
    console.error(
      chalk.red("[Error] [TRANSACTION JOB] in cron job execution:"),
      error
    );
  } finally {
    console.log(
      chalk.blue(
        `[Cron Job - [TRANSACTION JOB] Ended] Time: ${new Date().toISOString()}`
      )
    );
  }
});
