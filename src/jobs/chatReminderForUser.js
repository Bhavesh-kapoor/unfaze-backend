import chalk from "chalk";
import cron from "node-cron";
import { User } from "../models/userModel.js";
import { Message } from "../models/messageModel.js";
import {
  makeParameterForWATTI,
  sendTemplateMultipleUserMessages,
} from "../controllers/wattiTemplates.js";

cron.schedule("0 */6 * * *", async () => {
  try {
    const users = await User.find(
      {
        mobile: { $exists: true, $ne: "" },
        role: { $in: ["user", "corp-user"] },
        isMobileVerified: true,
      },
      { _id: 1, firstName: 1, lastName: 1, mobile: 1 }
    );

    const chats = await Message.aggregate([
      { $match: { receiverId: { $in: users.map((t) => t._id) } } },
      {
        $lookup: {
          from: "users",
          localField: "receiverId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$receiverId",
          messages: { $first: "$$ROOT" },
          firstName: { $first: "$userInfo.firstName" },
          lastName: { $first: "$userInfo.lastName" },
          mobile: { $first: "$userInfo.mobile" },
        },
      },
    ]);

    const unreadChats = chats.filter(
      (chat) => chat?.messages?._id && !chat?.messages?.read
    );
    if (unreadChats && unreadChats.length > 0) {
      const receivers = unreadChats.map((user) => ({
        whatsappNumber: user?.mobile.toString(),
        customParams: makeParameterForWATTI({
          name: `${user?.firstName} ${user?.lastName}`,
        }),
      }));
      try {
        const resp = await sendTemplateMultipleUserMessages(
          "chat_pending_for_user",
          receivers
        );
        if (resp)
          console.log(
            chalk.green(
              `[PENDING CHATS FOR USERS] Notifications sent to ${unreadChats.length} users.`
            )
          );
        else
          console.log(
            chalk.red(
              `[PENDING CHATS FOR USERS] Notifications not sent to users.`
            )
          );
      } catch (sendError) {
        console.error(
          chalk.red(
            `[PENDING CHATS FOR USERS] Error sending notifications:`,
            sendError
          )
        );
      }
    } else {
      console.log(
        chalk.yellow(
          `[PENDING CHATS FOR USERS] No unread messages found for any users.`
        )
      );
    }
  } catch (error) {
    console.error(
      chalk.red(
        `[PENDING CHATS FOR USERS] Error during unread messages found for any users cron job:`,
        error
      )
    );
  }
});
