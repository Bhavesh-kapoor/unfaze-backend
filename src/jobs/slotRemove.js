import chalk from "chalk";
import cron from "node-cron";
import { subDays } from "date-fns";
import { Slot } from "../models/slotModal.js";

cron.schedule("0 0 * * 1", async () => {
  const jobTitle = "[SLOT CLEANUP JOB]";
  try {
    console.log(chalk.blue(`${jobTitle} Starting slot cleanup...`));
    const oneDayAgo = subDays(new Date(), 1);

    const deleteSlots = await Slot.updateMany(
      {
        "timeslots.date": { $lte: oneDayAgo },
        "timeslots.isBooked": false,
      },
      {
        $pull: {
          timeslots: {
            date: { $lte: oneDayAgo },
            isBooked: false,
          },
        },
      }
    );

    if (deleteSlots.modifiedCount > 0) {
      const updatedSlots = await Slot.aggregate([
        {
          $match: {
            "timeslots.date": { $lte: oneDayAgo },
            "timeslots.isBooked": false,
          },
        },
        {
          $group: {
            _id: "$therapist_id",
            deletedCount: { $sum: 1 },
          },
        },
      ]);

      if (updatedSlots.length > 0) {
        updatedSlots.forEach((slot) => {
          console.log(
            chalk.green(
              `${jobTitle} Therapist ID: ${slot._id} had ${slot.deletedCount} unbooked slots older than a day deleted.`
            )
          );
        });
      } else {
        console.log(chalk.yellow(`${jobTitle} No unbooked slots found.`));
      }
    } else {
      console.log(
        chalk.yellow(
          `${jobTitle} No slots found with 'IS_BOOKED_NOT_TRUE' status older than a day.`
        )
      );
    }
  } catch (error) {
    console.error(chalk.red(`${jobTitle} Error during slot cleanup:`, error));
  }
});
