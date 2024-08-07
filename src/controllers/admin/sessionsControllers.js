import { parseISO, addMinutes, format } from "date-fns";
import { Session } from "../../models/sessionsModel.js";
import { EnrolledCourse } from "../../models/enrolledCourse.model.js";
import { Therapist } from "../../models/therepistModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Course } from "../../models/courseModel.js";

const SESSION_DURATION_MINUTES = 60;
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
  const { enrolledCourseId, date, startTime, user_id } = req.body;
  // const { user_id } = req.user?._id;

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
  const therapistId = enrolledCourse.course_id.therapist_id;
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

  // Create and save the new session
  const session = new Session({
    enrolled_course_id: enrolledCourseId,
    user_id: user_id,
    therapist_id: therapistId,
    start_time: startDateTime,
    end_time: endDateTime,
  });

  try {
    await session.save();
    enrolledCourse.remaining_sessions -= 1;
    if (enrolledCourse.remaining_sessions === 0) {
      enrolledCourse.active = false;
    }
    await enrolledCourse.save();
    res.status(201).send({
      session,
      message: "Session booked successfully",
    });
  } catch (error) {
    res.status(500).send({ error: "Failed to book session" });
  }
});

export { availableSlots, bookaSession };
