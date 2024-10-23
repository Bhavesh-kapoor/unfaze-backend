import chalk from "chalk";
import cron from "node-cron";
import { Message } from "../models/messageModel.js";
import { Therapist } from "../models/therapistModel.js";
import { sendTemplateMessage } from "../controllers/wattiTemplates.js";

cron.schedule("0 */2 * * *", async () => {
  try {
    const therapists = await Therapist.find(
      {},
      { _id: 1, firstName: 1, lastName: 1, mobile: 1 }
    );
    const chats = await Message.aggregate([
      { $match: { receiverId: { $in: therapists.map((t) => t._id) } } },
      {
        $lookup: {
          from: "therapists",
          localField: "receiverId",
          foreignField: "_id",
          as: "therapistInfo",
        },
      },
      { $unwind: "$therapistInfo" },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$receiverId",
          messages: { $first: "$$ROOT" },
          firstName: { $first: "$therapistInfo.firstName" },
          lastName: { $first: "$therapistInfo.lastName" },
          mobile: { $first: "$therapistInfo.mobile" },
        },
      },
    ]);
    const unreadChats = chats.filter(
      (chat) => chat?.messages?._id && !chat?.messages?.read
    );

    if (unreadChats && unreadChats.length > 0) {
      unreadChats.map(async (unread) => {
        const therapistName = `${unread.firstName} ${unread.lastName}`;
        console.log(
          chalk.green(
            `[PENDING CHATS FOR THERAPISTS] Sending notification to therapist: ${therapistName} for unread message`
          )
        );
        try {
          const resp = await sendTemplateMessage(
            "chat_reminder_for_therapists",
            {
              mobile: unread?.mobile,
              therapist_name: therapistName,
            }
          );
          if (resp)
            console.log(
              chalk.blue(
                `[PENDING CHATS FOR THERAPISTS] Notification sent successfully to therapist: ${therapistName}`
              )
            );
          console.log(
            chalk.red(
              `[PENDING CHATS FOR USERS] Notifications not sent to therapist.`
            )
          );
        } catch (sendError) {
          console.error(
            chalk.red(
              `[PENDING CHATS FOR THERAPISTS] Error sending notification to therapist: ${therapistName}:`,
              sendError
            )
          );
        }
      });
    } else {
      console.log(
        chalk.yellow(
          `[PENDING CHATS FOR THERAPISTS] No unread messages found for any therapist.`
        )
      );
    }
  } catch (error) {
    console.error(
      chalk.red(
        `[PENDING CHATS FOR THERAPISTS] Error during session reminder cron job:`,
        error
      )
    );
  }
});
