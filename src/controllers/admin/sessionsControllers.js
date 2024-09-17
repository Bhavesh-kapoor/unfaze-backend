import { parseISO, addMinutes, format } from "date-fns";
import { Session } from "../../models/sessionsModel.js";
import { Therapist } from "../../models/therapistModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Course } from "../../models/courseModel.js";

const SESSION_DURATION_MINUTES = 30;
const GAP_BETWEEN_SESSIONS_MINUTES = 15;
const START_HOUR = 9;
const END_HOUR = 17;
// Utility function to get all possible slots for a day
const generateSlots = (date) => {
  let slots = [];
  let startTime = new Date(date.setHours(START_HOUR, 0, 0, 0));
  let endTime = new Date(date.setHours(END_HOUR, 0, 0, 0));

  while (startTime < endTime) {
    let slotEndTime = addMinutes(startTime, SESSION_DURATION_MINUTES);
    slots.push({
      start: new Date(startTime),
      end: new Date(slotEndTime),
      available: true,
    });
    startTime = addMinutes(slotEndTime, GAP_BETWEEN_SESSIONS_MINUTES);
  }

  return slots;
};

const availableSlots = async (req, res) => {
  const { therapistId, date } = req.body;

  const parsedDate = parseISO(date);
  const existingSessions = await Session.find({
    therapist_id: therapistId,
    start_time: {
      $gte: new Date(parsedDate.setHours(START_HOUR, 0, 0, 0)),
      $lt: new Date(parsedDate.setHours(END_HOUR, 0, 0, 0)),
    },
  });

  const allSlots = generateSlots(parsedDate);

  // Mark unavailable slots
  existingSessions.forEach((session) => {
    allSlots.forEach((slot) => {
      if (
        (slot.start >= session.start_time && slot.start < session.end_time) ||
        (slot.end > session.start_time && slot.end <= session.end_time)
      ) {
        slot.available = false;
      }
    });
  });
  res.status(200).json({
    date: format(parsedDate, "yyyy-MM-dd"),
    slots: allSlots.map((slot) => ({
      start: format(slot.start, "HH:mm"),
      end: format(slot.end, "HH:mm"),
      available: slot.available,
    })),
  });
};

const bookaSession = asyncHandler(async (req, res) => {
  const { therapist_id, date, startTime } = req.body;
  const user_id = req.user?._id
  /*
    const enrolledCourse = await EnrolledCourse.findOne({
      _id: enrolledCourseId,
      user_id: user_id,
    }).populate({
      path: "course_id",
      select: "therapist_id",
    });
    if (!enrolledCourse) {
      return res
        .status(404)
        .json(new ApiError(404, "", "No Enrolled course found"));
    }
    console.log("enrolledCourse", enrolledCourse);
    if (enrolledCourse.active === false) {
      return res
        .status(404)
        .json(new ApiError(404, "", "you already booked all your sessions!"));
    }
        */

  const therapistId = therapist_id;
  const startDateTime = parseISO(`${date}T${startTime}`);
  const endDateTime = addMinutes(startDateTime, SESSION_DURATION_MINUTES);

  // Check if the session times are valid
  if (startDateTime >= endDateTime) {
    return res.status(400).send({ error: "End time must be after start time" });
  }
  // Check if the slot is available
  const existingSession = await Session.findOne({
    therapist_id: therapistId,
    start_time: startDateTime,
    end_time: endDateTime,
  });

  if (existingSession) {
    return res.status(400).send({ error: "Slot is already booked!" });
  }
  //payments 

  // Create and save the new session
  try {
    const session = new Session({
      user_id: user_id,
      therapist_id: therapistId,
      start_time: startDateTime,
      end_time: endDateTime,
    });
    const uid = Math.floor(100000 + Math.random() * 900000);
    const channelName = `session_${session._id}_${uid}`;
    session.uid = uid;
    session.channelName = channelName;
    await session.save();
    res.status(201).send({
      session,
      message: "Session booked successfully",
    });
  } catch (error) {
    res.status(500).send({ error: "Failed to book session" });
  }
});

const bookedSessions = asyncHandler(async (req, res) => {
  const user_id = req.user?._id;

  const sessions = await Session.aggregate([
    {
      $match: { user_id: user_id }
    },
    {
      $lookup: {
        from: "therapists",
        localField: "therapist_id",
        foreignField: "_id",
        as: "therapist_details"
      }
    },
    // {
    //   $unwind: "$therapist"
    // },
    // {
    //   $group: {
    //     _id: "$status",
    //     sessions: {
    //       $push: {
    //         _id: "$_id",
    //         date: "$date",
    //         therapist_id: "$therapist._id",
    //         therapistName: `$therapist.firstName $therapist.firstName`,
    //         channelName: "$channelName",
    //         firstName: "$therapist.firstName",
    //         lastName: "$therapist.lastName",
    //         email: "$therapist.email"
    //       }
    //     }
    //   }
    // }
  ]);
  console.log("session-----------s", sessions)

  res.status(200).json(new ApiResponse(200, sessions, "Session fetched successfully!"));
});
// ----------------------------------------------------------------------------------------
const sessionCompleted = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
if(!sessionId){
  return res.status(400).json(new ApiResponse(400, null, "Invalid Session ID"));
}
  const user = req.user;
  const session = await Session.findByIdAndUpdate(sessionId, { status: "completed" }, { new: true });
  return res.status(200).json(new ApiResponse(200, session, "Session completed successfully!"));
})

export {sessionCompleted };
