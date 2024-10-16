import cron from 'node-cron';
import { Session } from '../models/sessionsModel.js';
import { format, addMinutes, isWithinInterval } from 'date-fns';
import { sendMail } from '../utils/sendMail.js';
import { userSessionReminderEmailTemplate, therapistSessionReminderEmailTemplate } from '../static/emailcontent.js';
// Cron job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
        const now = new Date();
        const timeWindowStart = now;
        const timeWindowEnd = addMinutes(now, 30);

        const sessions = await Session.find({
            start_time: {
                $gte: timeWindowStart,
                $lte: timeWindowEnd,
            },
            status: { $in: ['upcoming', 'rescheduled'] },
        }).populate('user_id therapist_id');

        if (sessions) {
            for (const session of sessions) {
                const userEmail = session.user_id.email;
                const therapistEmail = session.therapist_id.email;
                const userName = `${session.user_id.firstName} ${session.user_id.lastName}`
                const therapistName = `${session.therapist_id.firstName} ${session.therapist_id.lastName}`
                const startTimeFormatted = format(session.start_time, 'PPPP');
                const subject = "Reminder: Session is Starting Soon!"
                // Send email to user
                if (userEmail) {
                    const emailContent = userSessionReminderEmailTemplate(userName, therapistName, startTimeFormatted)
                    await sendMail(userEmail, subject, emailContent);
                    console.log(`Reminder sent to user: ${userEmail}`);
                }
                // Send email to therapist
                if (therapistEmail) {
                    const emailContent = therapistSessionReminderEmailTemplate(therapistName, userName, startTimeFormatted)
                    await sendMail(therapistEmail, subject, emailContent);
                    console.log(`Reminder sent to therapist: ${therapistEmail}`);
                }
            }
        }
    } catch (error) {
        console.error('Error while sending session reminders:', error);
    }
});

