import chalk from "chalk";
import cron from "node-cron";
import { subMinutes } from "date-fns"; // Used to subtract 16 minutes
import { sendTemplateMessage } from "../controllers/wattiTemplates.js";
import { Session } from "../models/sessionsModel.js"; // Assuming you have a session model

// Cron job to run at the 15th and 45th minute of every hour
cron.schedule("15,45 * * * *", async () => {
  try {
    const now = new Date();
    const sixteenMinutesAgo = subMinutes(now, 16); // Get the time 16 minutes ago

    // Find sessions where end_time is between 16 minutes ago and now
    const missedSessions = await Session.find({
      status: "missed", // Ensure the session has been marked as missed
      end_time: {
        $gte: sixteenMinutesAgo, // Session must have ended 16 minutes ago or more recently
        $lt: now, // But before the current time
      },
    }).populate("user_id"); // Populating user details

    if (missedSessions.length > 0) {
      for (const session of missedSessions) {
        try {
          const userName = `${session?.user_id?.firstName} ${session?.user_id?.lastName}`;
          const userMobile = session?.user_id?.mobile;

          // Send the missed session reminder message to the user
          await sendTemplateMessage("session_missed_by_user", {
            name: userName,
            mobile: userMobile,
          });

          console.log(
            chalk.green(
              `Missed session reminder sent successfully for session: ${session._id}`
            )
          );
        } catch (sendError) {
          console.error(
            chalk.red(
              `Error sending missed session reminder for session ${session._id}:`,
              sendError
            )
          );
        }
      }
    } else {
      console.log(chalk.yellow("No missed sessions found."));
    }
  } catch (error) {
    console.error(chalk.red("Error during missed session cron job:", error));
  }
});
