import chalk from "chalk";
import cron from "node-cron";
import { format, addMinutes } from "date-fns";
import { Session } from "../models/sessionsModel.js";
import { sendTemplateMessage } from "../controllers/wattiTemplates.js";

/**
 * Utility function to format the session start time based on type.
 * @param {Date} date - The date to format.
 * @param {string} type - The format type ('date' or 'time').
 * @returns {string} - Formatted date or time.
 */
export const formatSessionStartTime = (date, type) => {
  if (type === "date") {
    return format(date, "dd-MM-yyyy"); // Format as '20-10-2024'
  } else if (type === "time") {
    return format(date, "hh:mm a"); // Format as '10:00 PM'
  }
  return format(date, "PPPP"); // Default format
};

// Utility function to create a delay (e.g., 1 second between emails)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cron job to run every 30 minutes
cron.schedule("30,0 * * * *", async () => {
  try {
    const now = new Date();
    const sessionStartWindowStart = addMinutes(now, 29); // Start window 29 minutes from now
    const sessionStartWindowEnd = addMinutes(now, 31); // End window 31 minutes from now

    console.log(
      chalk.blue(
        `Checking sessions between ${format(
          sessionStartWindowStart,
          "hh:mm a"
        )} and ${format(sessionStartWindowEnd, "hh:mm a")}`
      )
    );

    // Find sessions starting in the next 30-45 minute window
    const upcomingSessions = await Session.find({
      start_time: {
        $gte: sessionStartWindowStart,
        $lte: sessionStartWindowEnd, // Get sessions starting within the 29-31 minute window
      },
      status: { $in: ["upcoming", "rescheduled"] }, // Ensure the session is upcoming or rescheduled
    }).populate("user_id therapist_id"); // Populate user and therapist details

    if (upcomingSessions.length > 0) {
      for (const session of upcomingSessions) {
        try {
          const userName = `${session?.user_id?.firstName} ${session?.user_id?.lastName}`;
          const userMobile = session?.user_id?.mobile;
          const therapistMobile = session?.therapist_id?.mobile;
          const therapistName = `${session?.therapist_id?.firstName} ${session?.therapist_id?.lastName}`;

          // Construct URLs based on roles
          const sessionUserUrl =
            session?.user_id?.role === "user"
              ? `${process.env.FRONTEND_URL}/profile/therapy-sessions`
              : `${process.env.FRONTEND_URL}/profile/dashboard`;

          const sessionTherapistUrl =
            session?.therapist_id?.role === "therapist"
              ? `${process.env.FRONTEND_URL}/therapist-profile/sessions`
              : null; // Handle cases where therapist role is not recognized

          const data = {
            therapist_name: therapistName,
            session_date: formatSessionStartTime(session.start_time, "date"),
            session_time: formatSessionStartTime(session.start_time, "time"),
          };

          // Send reminder messages
          await sendTemplateMessage("session_reminder_for_user", {
            ...data,
            name: userName,
            mobile: userMobile,
            session_url: sessionUserUrl,
          });

          // Add a delay between sending user and therapist emails
          await delay(250); // 0.25 second delay before sending the next email

          await sendTemplateMessage("session_reminder_for_therapists", {
            ...data,
            client_name: userName,
            mobile: therapistMobile,
            session_url: sessionTherapistUrl,
          });

          console.log(
            chalk.green(
              `Reminder sent successfully for session: ${session._id}`
            )
          );

          // Add a delay before processing the next session
          await delay(250); // 0.25 second delay before the next iteration
        } catch (sendError) {
          console.error(
            chalk.red(
              `Error sending reminder for session ${session._id}:`,
              sendError
            )
          );
        }
      }
    } else {
      console.log(chalk.yellow("No sessions starting in the next 30 minutes."));
    }
  } catch (error) {
    console.error(chalk.red("Error during session reminder cron job:", error));
  }
});
