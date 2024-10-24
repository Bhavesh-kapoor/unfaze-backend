import chalk from "chalk";
import cron from "node-cron";
import { subWeeks, subDays } from "date-fns";
import { Transaction } from "../models/transactionModel.js";

cron.schedule("0 0 * * 1", async () => {
  const jobTitle = "[TRANSACTION CLEANUP JOB]";
  try {
    console.log(chalk.blue(`${jobTitle} Starting transaction cleanup...`));
    const oneWeekAgo = subWeeks(new Date(), 1);

    const result = await Transaction.deleteMany({
      payment_status: "PAYMENT_INITIATED",
      createdAt: { $lte: oneWeekAgo },
    });

    if (result.deletedCount > 0) {
      console.log(
        chalk.green(
          `${jobTitle} ${result.deletedCount} transactions with 'PAYMENT_INITIATED' status older than a week were deleted.`
        )
      );
      console.log(
        chalk.magenta(
          `${jobTitle} Deleted transaction count: ${result.deletedCount}`
        )
      );
    } else {
      console.log(
        chalk.yellow(
          `${jobTitle} No transactions found with 'PAYMENT_INITIATED' status older than a week.`
        )
      );
    }
  } catch (error) {
    console.error(
      chalk.red(`${jobTitle} Error during transaction cleanup:`, error)
    );
  }
});
