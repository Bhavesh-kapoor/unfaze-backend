import cron from 'node-cron';
import { Session } from '../models/sessionsModel.js';
import { format, addMinutes } from 'date-fns';
import { sendMail } from '../utils/sendMail.js';
import { userSessionReminderEmailTemplate, therapistSessionReminderEmailTemplate } from '../static/emailcontent.js';

// Create a Set to track sessions that have had reminders sent
const sentReminders = new Set();

// Cron job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
        const now = new Date();
        const timeWindowEnd = addMinutes(now, 30);

        // Find sessions that are upcoming or rescheduled
        const sessions = await Session.find({
            start_time: {
                $gte: now,
                $lte: timeWindowEnd,
            },
            status: { $in: ['upcoming', 'rescheduled'] },
        }).populate('user_id therapist_id');

        if (sessions && sessions.length > 0) {
            for (const session of sessions) {
                const sessionId = session._id.toString();

                // Check if reminder has already been sent for this session
                if (sentReminders.has(sessionId)) {
                    console.log(`Reminder already sent for session: ${sessionId}`);
                    continue;
                }

                // Send reminder emails
                const userEmail = session.user_id.email;
                const therapistEmail = session.therapist_id.email;
                const userName = `${session.user_id.firstName} ${session.user_id.lastName}`;
                const therapistName = `${session.therapist_id.firstName} ${session.therapist_id.lastName}`;
                const startTimeFormatted = format(session.start_time, 'PPPP');
                const subject = "Reminder: Session is Starting Soon!";

                // Send email to user
                if (userEmail) {
                    const emailContent = userSessionReminderEmailTemplate(userName, therapistName, startTimeFormatted);
                    await sendMail(userEmail, subject, emailContent);
                    console.log(`Reminder sent to user: ${userEmail}`);
                }

                // Send email to therapist
                if (therapistEmail) {
                    const emailContent = therapistSessionReminderEmailTemplate(therapistName, userName, startTimeFormatted);
                    await sendMail(therapistEmail, subject, emailContent);
                    console.log(`Reminder sent to therapist: ${therapistEmail}`);
                }

                // Add the session ID to the sentReminders Set
                sentReminders.add(sessionId);
            }
        } else {
            console.log('No upcoming sessions requiring a reminder at this time.');
        }

        // Cleanup: Remove past session IDs from the Set
        for (const sessionId of sentReminders) {
            const session = await Session.findById(sessionId);
            if (session && session.start_time < now) {
                sentReminders.delete(sessionId);
            }
        }
    } catch (error) {
        console.error('Error while sending session reminders:', error);
    }
});
