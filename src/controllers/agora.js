import dotenv from "dotenv";
import AgoraToken from "agora-token";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Session } from "../models/sessionsModel.js";

dotenv.config();
const { RtcTokenBuilder, RtcRole } = AgoraToken;

const generateAgoraToken = (channelName, uid, role, expireTimeInSeconds) => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  if (!appID || !appCertificate) {
    throw new Error(
      "AGORA_APP_ID and AGORA_APP_CERTIFICATE must be defined in environment variables"
    );
  }

  const rtcRole = role === "user" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    rtcRole,
    privilegeExpireTime
  );
  return token;
};

export const generateSessionToken = asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  const user = req.user;
  const session = await Session.findById(session_id);
  if (!session) {
    return res.status(404).json(new ApiError(404, "", "Session not found!"));
  }

  const currentTime = new Date();

  const sessionStartTime = new Date(session.start_time);
  const sessionEndTime = new Date(session.end_time);
  if (currentTime > sessionEndTime) {
    return res
      .status(400)
      .json(
        new ApiError(400, "", "Session has expired. Token cannot be generated.")
      );
  }
  if (process.env.NODE_ENV == "production") {
    const timeDifferenceInMilliseconds = sessionStartTime - currentTime;
    if (timeDifferenceInMilliseconds > 15 * 60 * 1000) {
      const hoursRemaining = Math.floor(
        timeDifferenceInMilliseconds / (1000 * 60 * 60)
      );
      const minutesRemaining = Math.floor(
        (timeDifferenceInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
      );
      const secondsRemaining = Math.floor(
        (timeDifferenceInMilliseconds % (1000 * 60)) / 1000
      );
      // Format the waiting time into HH:MM:SS format
      const formattedWaitingTime = `${String(hoursRemaining).padStart(
        2,
        "0"
      )}:${String(minutesRemaining).padStart(2, "0")}:${String(
        secondsRemaining
      ).padStart(2, "0")}`;
      return res
        .status(400)
        .json(
          new ApiError(400, "", `Please wait for ${formattedWaitingTime}.`)
        );
    }
  }
  const uid = Math.floor(100000 + Math.random() * 900000);
  const channelName = session.channelName;
  const role = user.role;
  const expireTimeInSeconds = 1800;
  const token = generateAgoraToken(channelName, uid, role, expireTimeInSeconds);
  if (!token) {
    return res
      .status(500)
      .json(
        new ApiError(
          500,
          "",
          "Something went wrong while generating the token!"
        )
      );
  }
  const join_url = `/session/${uid}?channel=${channelName}`;
  res.status(200).json({ join_url: join_url });
});
