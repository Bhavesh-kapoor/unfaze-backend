import mongoose from "mongoose";
import cron from "node-cron";
import { subMinutes } from "date-fns";
import chalk from "chalk"; // Import chalk
import { Session } from "../models/sessionsModel.js";

// Cron job to run every 15 minutes
cron.schedule("*/15 * * * *", async () => {
  const currentTime = new Date();
  console.log(
    chalk.blue(`[Cron Job - [MISSED MARKED] Started] Time: ${currentTime.toISOString()}`)
  );

  try {
    const now = new Date();
    const thresholdTime = subMinutes(now, 5); // Sessions ending 5 minutes ago or earlier

    try {
      const missedSessions = await Session.updateMany(
        {
          end_time: { $lt: thresholdTime }, // Session end time is in the past
          status: { $nin: ["completed", "cancelled", "missed"] }, // Status is not completed, cancelled, or missed
        },
        { $set: { status: "missed" } }
      );

      console.log(
        chalk.green(
          `[Cron Job - [MISSED MARKED] ] Updated ${missedSessions.modifiedCount} sessions to 'missed' status.`
        )
      );
    } catch (updateError) {
      console.error(
        chalk.red("[Error] [MISSED MARKED] While updating sessions status:"),
        updateError
      );
    }
  } catch (error) {
    console.error(chalk.red("[Error] [MISSED MARKED] in cron job execution:"), error);
  } finally {
    console.log(
      chalk.blue(`[Cron Job - [MISSED MARKED] Ended] Time: ${new Date().toISOString()}`)
    );
  }
});
