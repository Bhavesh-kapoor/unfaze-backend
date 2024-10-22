import cron from "node-cron";
import { format, addMinutes } from "date-fns";
import chalk from "chalk"; // Import chalk
import { sendMail } from "../utils/sendMail.js";
import { Session } from "../models/sessionsModel.js";
import {
  userSessionReminderEmailTemplate,
  therapistSessionReminderEmailTemplate,
} from "../static/emailcontent.js";

// Create a Set to track sessions that have had reminders sent
const sentReminders = new Set();

// Utility function for handling delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cron job to run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();
    const timeWindowEnd = addMinutes(now, 30);

    let sessions;
    try {
      // Find sessions that are upcoming or rescheduled
      sessions = await Session.find({
        start_time: {
          $gte: now,
          $lte: timeWindowEnd,
        },
        status: { $in: ["upcoming", "rescheduled"] },
      }).populate("user_id therapist_id");
    } catch (findError) {
      console.error(chalk.red("Error finding sessions:"), findError);
      return; // Exit the cron if there's an issue fetching sessions
    }

    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        const sessionId = session._id.toString();

        // Check if reminder has already been sent for this session
        if (sentReminders.has(sessionId)) {
          console.log(
            chalk.yellow(`Reminder already sent for session: ${sessionId}`)
          );
          continue;
        }

        try {
          // Send reminder emails
          const userEmail = session?.user_id?.email;
          const therapistEmail = session?.therapist_id?.email;
          const userName = `${session?.user_id?.firstName ?? ""} ${
            session?.user_id?.lastName ?? ""
          }`;
          const therapistName = `${session?.therapist_id?.firstName ?? ""} ${
            session?.therapist_id?.lastName ?? ""
          }`;
          const startTimeFormatted = format(session.start_time, "PPPP");
          const subject = "Reminder: Session is Starting Soon!";

          // Ensure emails exist before proceeding
          if (!userEmail || !therapistEmail) {
            console.warn(
              chalk.yellow(`Missing email details for session: ${sessionId}`)
            );
            continue; // Skip this session if email is not available
          }

          // Send email to user
          try {
            const emailContent = userSessionReminderEmailTemplate(
              userName,
              therapistName,
              startTimeFormatted
            );
            await sendMail(userEmail, subject, emailContent);
            console.log(chalk.green(`Reminder sent to user: ${userEmail}`));
          } catch (userEmailError) {
            console.error(
              chalk.red(`Error sending reminder to user ${userEmail}:`),
              userEmailError
            );
          }

          // Delay to avoid overloading the mail server
          await delay(200); // 0.2-second delay between emails

          // Send email to therapist
          try {
            const emailContent = therapistSessionReminderEmailTemplate(
              therapistName,
              userName,
              startTimeFormatted
            );
            await sendMail(therapistEmail, subject, emailContent);
            console.log(
              chalk.green(`Reminder sent to therapist: ${therapistEmail}`)
            );
          } catch (therapistEmailError) {
            console.error(
              chalk.red(
                `Error sending reminder to therapist ${therapistEmail}:`
              ),
              therapistEmailError
            );
          }

          // Add the session ID to the sentReminders Set
          sentReminders.add(sessionId);
        } catch (sessionError) {
          console.error(
            chalk.red(`Error processing session ${sessionId}:`),
            sessionError
          );
        }
      }
    } else {
      console.log(
        chalk.gray("No upcoming sessions requiring a reminder at this time.")
      );
    }

    // Cleanup: Remove past session IDs from the Set
    for (const sessionId of sentReminders) {
      try {
        const session = await Session.findById(sessionId);
        if (session && session.start_time < now) {
          sentReminders.delete(sessionId);
        }
      } catch (cleanupError) {
        console.error(
          chalk.red(`Error cleaning up session ${sessionId}:`),
          cleanupError
        );
      }
    }
  } catch (error) {
    console.error(chalk.red("Error during session reminder cron job:"), error);
  }
});
