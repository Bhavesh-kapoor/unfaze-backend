import cron from "node-cron";
import { format, addMinutes } from "date-fns";
import { Session } from "../models/sessionsModel.js"; // Assuming you have a session model
import { sendTemplateMessage } from "../controllers/wattiTemplates.js";
import chalk from "chalk";

/**
 * Utility function to format the session start time based on type.
 * @param {Date} date - The date to format.
 * @param {string} type - The format type ('date' or 'time').
 * @returns {string} - Formatted date or time.
 */
const formatSessionStartTime = (date, type) => {
  if (type === "date") {
    return format(date, "dd-MM-yyyy"); // Format as '20-10-2024'
  } else if (type === "time") {
    return format(date, "hh:mm a"); // Format as '10:00 PM'
  }
  return format(date, "PPPP"); // Default format
};

// Cron job to run every 30 minutes
cron.schedule("30,0 * * * *", async () => {
  try {
    const now = new Date();
    const sessionStartWindowStart = addMinutes(now, 29); // Start window 29 minutes from now
    const sessionStartWindowEnd = addMinutes(now, 44); // End window 44 minutes from now

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
        $lte: sessionStartWindowEnd, // Get sessions starting within the 30-45 minute window
      },
      status: { $in: ["upcoming", "rescheduled"] }, // Ensure the session is upcoming or rescheduled
    }).populate("user_id therapist_id"); // Populate user and therapist details

    if (upcomingSessions.length > 0) {
      for (const session of upcomingSessions) {
        try {
          const userName = `${session.user_id.firstName} ${session.user_id.lastName}`;
          const userMobile = session?.user_id?.mobile;
          const therapistMobile = session?.therapist_id?.mobile;
          const therapistName = `${session.therapist_id.firstName} ${session.therapist_id.lastName}`;

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
      console.log(
        chalk.yellow("No sessions starting in the next 30-45 minutes.")
      );
    }
  } catch (error) {
    console.error(chalk.red("Error during session reminder cron job:", error));
  }
});
