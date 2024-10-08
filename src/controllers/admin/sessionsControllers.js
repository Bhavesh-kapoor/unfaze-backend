import { parseISO, addMinutes, format, isValid } from "date-fns";
import { Session } from "../../models/sessionsModel.js";
import { Therapist } from "../../models/therapistModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
// import { Course } from "../../models/courseModel.js";
import mongoose from "mongoose";
import { Slot } from "../../models/slotModal.js";
import { Transaction } from "../../models/transactionModel.js";
import { sendNotificationsAndEmails } from "../paymentHandler.js";
import { User } from "../../models/userModel.js";
import { EnrolledCourse } from "../../models/enrolledCourseModel.js";
import { convertTo24HourFormat } from "../../utils/convertTo24HrFormat.js";
import { sessionBookingConfirmation } from "../../static/emailcontent.js";
import { Specialization } from "../../models/specilaizationModel.js";
import { TherapistPay } from "../../models/therapistPayModel.js";
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
  const user_id = req.user?._id;
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
      $match: { user_id: user_id },
    },
    {
      $lookup: {
        from: "therapists",
        localField: "therapist_id",
        foreignField: "_id",
        as: "therapist_details",
      },
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
  console.log("session-----------s", sessions);

  res
    .status(200)
    .json(new ApiResponse(200, sessions, "Session fetched successfully!"));
});
// ----------------------------------------------------------------------------------------
const sessionCompleted = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid Session ID"));
  }
  const user = req.user;
  const session = await Session.findByIdAndUpdate(
    sessionId,
    { status: "completed" },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, session, "Session completed successfully!"));
});

const rescheduleSession = asyncHandler(async (req, res) => {
  const { session_id, slot_id } = req.body;
  const user = req.user
  if (!session_id || !slot_id) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid Session ID or Slot ID"));
  }
  const session = await Session.findOne({ _id: session_id, status: "missed" });
  if (!session) {
    return res
      .status(400)
      .json(new ApiError(400, null, "You cant't reschedule this session!"));
  }
  const therapist = await Therapist.findById(session.therapist_id);
  if (!therapist) {
    return res
      .status(404)
      .json(new ApiError(404, null, "Therapist not found"));
  }
  const timeSlots = await Slot.aggregate([
    {
      $match: {
        therapist_id: session.therapist_id,
      },
    },
    {
      $unwind: "$timeslots",
    },
    {
      $match: {
        "timeslots._id": new mongoose.Types.ObjectId(slot_id),
        "timeslots.isBooked": false,
      },
    },
    {
      $project: {
        _id: "$timeslots._id",
        therapist_id: 1,
        date: "$timeslots.date",
        startTime: "$timeslots.startTime",
        endTime: "$timeslots.endTime",
        isBooked: "$timeslots.isBooked",
      },
    },
  ]);
  if (timeSlots.length === 0) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Timeslot not found or already booked"));
  }
  const { date, startTime, endTime } = timeSlots[0];
  const formattedDate = format(new Date(date), "yyyy-MM-dd");
  const startDateTime = new Date(
    `${formattedDate}T${convertTo24HourFormat(startTime)}`
  );
  const endDateTime = new Date(
    `${formattedDate}T${convertTo24HourFormat(endTime)}`
  );
  if (!isValid(startDateTime) || !isValid(endDateTime)) {
    console.error("Invalid date-time format:", startDateTime, endDateTime);
    return res
      .status(400)
      .json(new ApiError(400, "", "Invalid date or time format"));
  }
  if (startDateTime >= endDateTime) {
    return res.status(400).send({ error: "End time must be after start time" });
  }
  session.start_time = startDateTime;
  session.end_time = endDateTime;
  session.status = "rescheduled";
  const rescheduled = await session.save();
  await Slot.updateOne(
    {
      therapist_id: new mongoose.Types.ObjectId(session.therapist_id),
      "timeslots._id": new mongoose.Types.ObjectId(slot_id),
    },
    {
      $set: {
        "timeslots.$.isBooked": true,
      },
    }
  );
  if (process.env.DEV_MODE === 'prod') {
    const message = `${user.firstName} ${user.lastName} has reschedule a session.`;
    const subject = "Session Reschedule Confirmation";
    const htmlContent = sessionBookingConfirmation(`${user.firstName} ${user.lastName}`, `${therapist.firstName} ${therapist.lastName}`)
    await sendNotificationsAndEmails(user, therapist, htmlContent, message, subject);
  }
  res.status(201).json(new ApiResponse(201, rescheduled, "session recheduled"));
});
const bookSessionManully = asyncHandler(async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "transaction Id required!"));
    }
    const transaction = await Transaction.findOne({
      transactionId: transactionId,
      payment_status: "successful",
    });
    if (!transaction) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, "Transaction not found or payment failed!")
        );
    }
    const user = await User.findById(transaction.user_id);
    const therapist = await Therapist.findById(transaction.therapist_id);
    const session = await Session.findOne({ transaction_id: transaction._id });
    if (session) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Session already booked!"));
    }
    const newSession = new Session({
      user_id: transaction.user_id,
      therapist_id: transaction.therapist_id,
      start_time: transaction.start_time,
      end_time: transaction.end_time,
      transaction_id: transaction.transactionId,
      status: "upcoming",
    });
    let channelName = newSession._id.toString().slice(-10);
    channelName = `session_${channelName}`;
    session.channelName = channelName;
    await session.save();
    if (process.env.DEV_MODE === 'prod') {
      const message = `${user.firstName} ${user.lastName} has successfully booked a session.`;
      const subject = "Session Booking Confirmation";
      const htmlContent = sessionBookingConfirmation(`${user.firstName} ${user.lastName}`, `${therapist.firstName} ${therapist.lastName}`)
      await sendNotificationsAndEmails(user, therapist, htmlContent, message, subject);
    }
    res
      .status(201)
      .json(new ApiResponse(201, session, "Session booked successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, error, "something went wrong");
  }
});
// for admin----------------------
const getUserSessions = async (req, res) => {
  try {
    const { userId, status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json(new ApiError(400, null, "User ID is required!"));
    }

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "User not found!"));
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    // const now = new Date();

    const matchConditions = {
      user_id: new mongoose.Types.ObjectId(userId),
      status: status,
    };

    // if (status === "upcoming") {
    //   matchConditions.start_time = { $gt: now };
    // }

    // Count total sessions to calculate total pages
    const totalSessions = await Session.countDocuments(matchConditions);

    // Get sessions data with aggregation
    const sessions = await Session.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "transactions",
          localField: "transaction_id",
          foreignField: "_id",
          as: "transactions_details",
        },
      },
      { $unwind: "$transactions_details" },
      {
        $lookup: {
          from: "therapists",
          localField: "transactions_details.therapist_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "therapist_details",
        },
      },
      { $unwind: "$therapist_details" },
      {
        $lookup: {
          from: "specializations",
          localField: "transactions_details.category",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "users",
          localField: "transactions_details.user_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $project: {
          transactionId: 1,
          createdAt: 1,
          userName: {
            $concat: ["$user_details.firstName", " ", "$user_details.lastName"],
          },
          therapistName: {
            $concat: [
              "$therapist_details.firstName",
              " ",
              "$therapist_details.lastName",
            ],
          },
          therapistId: "$therapist_details._id",
          category: "$category.name",
          amount_USD: "$transactions_details.amount_USD",
          amount_INR: "$transactions_details.amount_INR",
          start_time: 1,
          status: 1,
        },
      },
      { $sort: { start_time: 1 } },
      { $skip: skip },
      { $limit: limitNumber },
    ]);

    if (!sessions.length) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, "No sessions found"));
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalSessions / limitNumber);

    res.status(200).json({
      sessions,
      pagination: {
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        totalItems: totalSessions,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, "Server error"));
  }
};

const getTherapistSession = asyncHandler(async (req, res) => {
  try {
    const { Id, status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!Id) {
      return res.status(400).json(new ApiError(400, null, "User ID is required!"));
    }

    const user = await Therapist.findById(Id).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found!"));
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    const now = new Date();

    const matchConditions = {
      therapist_id: new mongoose.Types.ObjectId(Id),
      status: status
    };

    // if (status === "upcoming") {
    // }
    const totalSessions = await Session.countDocuments(matchConditions);
    const sessions = await Session.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: "transactions",
          localField: "transaction_id",
          foreignField: "_id",
          as: "transactions_details",
        },
      },
      { $unwind: "$transactions_details" },
      {
        $lookup: {
          from: "therapists",
          localField: "transactions_details.therapist_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "therapist_details",
        },
      },
      { $unwind: "$therapist_details" },
      {
        $lookup: {
          from: "specializations",
          localField: "transactions_details.category",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "users",
          localField: "transactions_details.user_id",
          foreignField: "_id",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $project: {
          transactionId: 1,
          createdAt: 1,
          userName: {
            $concat: ["$user_details.firstName", " ", "$user_details.lastName"],
          },
          therapistName: {
            $concat: [
              "$therapist_details.firstName",
              " ",
              "$therapist_details.lastName",
            ],
          },
          therapistId: "$therapist_details._id",
          category: "$category.name",
          amount_USD: "$transactions_details.amount_USD",
          amount_INR: "$transactions_details.amount_INR",
          start_time: 1,
          status: 1,
        },
      },
      { $sort: { start_time: 1 } },
      { $skip: skip },
      { $limit: limitNumber },
    ]);

    if (!sessions.length) {
      return res.status(404).json(new ApiResponse(404, null, "No sessions found"));
    }
    const totalPages = Math.ceil(totalSessions / limitNumber);

    res.status(200).json({
      sessions,
      pagination: {
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        totalItems: totalSessions,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, "Server error"));
  }
})

const BookSessionFromCourse = asyncHandler(async (req, res) => {
  try {
    const { enrolledCourseId, slotId } = req.query;
    const user = req.user;

    if (!enrolledCourseId || !slotId) {
      return res.status(400).json(new ApiError(400, "", "enrolledCourseId and slotId are required!"));
    }

    // Find enrolled course and check ownership
    const course = await EnrolledCourse.findOne({
      _id: new mongoose.Types.ObjectId(enrolledCourseId),
      userId: user._id,
    }).populate("courseId");

    if (!course) {
      return res.status(404).json(new ApiResponse(404, null, "Course not found"));
    }

    if (!course.remainingSessions) {
      return res.status(200).json(new ApiResponse(200, null, "You have already taken all your sessions"));
    }

    // Check therapist monetization
    const monetization = await TherapistPay.findOne({
      therapistId: course.therapistId,
      specializationId: course.courseId.specializationId,
    });
    if (!monetization) {
      return res.status(404).json(new ApiResponse(404, null, "This therapist is not monetized"));
    }
    // Find therapist and slot
    const therapist = await Therapist.findById(course.therapistId);

    const timeSlot = await Slot.aggregate([
      {
        $match: {
          therapist_id: new mongoose.Types.ObjectId(course.therapistId),
        },
      },
      {
        $unwind: "$timeslots",
      },
      {
        $match: {
          "timeslots._id": new mongoose.Types.ObjectId(slotId),
          "timeslots.isBooked": false,
        },
      },
      {
        $project: {
          _id: "$timeslots._id",
          therapist_id: 1,
          date: "$timeslots.date",
          startTime: "$timeslots.startTime",
          endTime: "$timeslots.endTime",
          isBooked: "$timeslots.isBooked",
        },
      },
    ]);

    if (!timeSlot.length) {
      return res.status(404).json(new ApiError(404, "", "Timeslot not found or already booked"));
    }

    // Extract slot details
    const { date, startTime, endTime } = timeSlot[0];
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const startDateTime = new Date(`${formattedDate}T${convertTo24HourFormat(startTime)}`);
    const endDateTime = new Date(`${formattedDate}T${convertTo24HourFormat(endTime)}`);

    if (!isValid(startDateTime) || !isValid(endDateTime)) {
      console.error("Invalid date-time format:", startDateTime, endDateTime);
      return res.status(400).json(new ApiError(400, "", "Invalid date or time format"));
    }

    if (startDateTime >= endDateTime) {
      return res.status(400).json(new ApiError(400, "", "End time must be after start time"));
    }

    // Create session and update slot
    const session = new Session({
      transaction_id: course.transactionId,
      therapist_id: course.therapistId,
      user_id: user._id,
      category: course.courseId.specializationId,
      start_time: startDateTime,
      end_time: endDateTime,
    });
    await Slot.updateOne(
      {
        therapist_id: new mongoose.Types.ObjectId(course.therapistId),
        "timeslots._id": new mongoose.Types.ObjectId(slotId),
      },
      { $set: { "timeslots.$.isBooked": true } }
    );
    await TherapistPay.updateOne(
      { therapistId: course.therapistId, specializationId: course.courseId.specializationId },
      { $inc: { count: 1 } }
    );


    // Set channelName for the session
    let channelName = `session_${session._id.toString().slice(-10)}`;
    session.channelName = channelName;
    await session.save();

    // Update remaining sessions and deactivate course if necessary
    course.remainingSessions -= 1;
    if (course.remainingSessions === 0) {
      course.isActive = false;
    }
    await course.save();

    // Send notifications and emails if in production mode
    if (process.env.DEV_MODE === 'prod') {
      const message = `${user.firstName} ${user.lastName} has successfully booked a session.`;
      const subject = "Session Booking Confirmation";
      const htmlContent = sessionBookingConfirmation(
        `${user.firstName} ${user.lastName}`,
        `${therapist.firstName} ${therapist.lastName}`
      );
      await sendNotificationsAndEmails(user, therapist, htmlContent, message, subject);
    }

    return res.status(200).json(new ApiResponse(200, session, "Session booked successfully"));
  } catch (error) {
    console.error(error);
    res.status(500).json(new ApiError(500, "Something went wrong", [error]));
  }
});


const manualSessionBooking = asyncHandler(async (req, res) => {
  try {
    const { user_id, therapist_id, specialization_id, slot_id } = req.body
    if (!user_id || !therapist_id || !specialization_id || !slot_id) {
      return res.status(400).json(new ApiError(400, "", "user_id, therapist_id, specialization_id and slot_id are required!"));
    }
    const therapist = await Therapist.findOne({ _id: therapist_id });
    // console.log(therapist);
    if (!therapist) {
      return res
        .status(404)
        .json(new ApiError(404, "", "Invalid therapist !!!"));
    }
    const user = await User.findOne({ _id: new mongoose.Types.ObjectId(user_id) });
    // console.log(therapist);
    if (!user) {
      return res
        .status(404)
        .json(new ApiError(404, "", "Invalid user !!!"));
    }
    const specialization = await Specialization.findById(specialization_id);
    if (!specialization) {
      return res.status(200).json(new ApiResponse(200, "", "Specialization not found"));
    }
    const timeSlots = await Slot.aggregate([
      {
        $match: {
          therapist_id: new mongoose.Types.ObjectId(therapist_id),
        },
      },
      {
        $unwind: "$timeslots",
      },
      {
        $match: {
          "timeslots._id": new mongoose.Types.ObjectId(slot_id),
          "timeslots.isBooked": false,
        },
      },
      {
        $project: {
          _id: "$timeslots._id",
          therapist_id: 1,
          date: "$timeslots.date",
          startTime: "$timeslots.startTime",
          endTime: "$timeslots.endTime",
          isBooked: "$timeslots.isBooked",
        },
      },
    ]);
    if (timeSlots.length === 0) {
      return res
        .status(404)
        .json(new ApiError(404, "", "Timeslot not found or already booked"));
    }
    await Slot.updateOne({
      therapist_id: new mongoose.Types.ObjectId(therapist_id),
      "timeslots._id": new mongoose.Types.ObjectId(slot_id),
    }, {
      $set: {
        "timeslots.$.isBooked": true,
      },
    })
    const { date, startTime, endTime } = timeSlots[0];
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const startDateTime = new Date(
      `${formattedDate}T${convertTo24HourFormat(startTime)}`
    );
    const [start_Time, startModifier] = startTime.split(" ");
    const [end_Time, endModifier] = endTime.split(" ");
    let endDateTime = new Date(
      `${formattedDate}T${convertTo24HourFormat(endTime)}`
    );

    if (startModifier === "PM" && endModifier === "AM") {
      endDateTime = addDays(endDateTime, 1);
    }
    if (!isValid(startDateTime) || !isValid(endDateTime)) {
      console.error("Invalid date-time format:", startDateTime, endDateTime);
      return res
        .status(400)
        .json(new ApiError(400, "", "Invalid date or time format"));
    }
    if (startDateTime >= endDateTime) {
      return res
        .status(400)
        .send({ error: "End time must be after start time" });
    }



    // Find therapist

    const session = new Session({
      transaction_id: null,
      therapist_id: therapist_id,
      user_id: user_id,
      start_time: startDateTime,
      end_time: endDateTime,
      manuallyBooked: true
    });
    let channelName = session._id.toString().slice(-10)
    channelName = `session_${channelName}`;
    session.channelName = channelName;
    await session.save();
    // const monetization = await TherapistPay.findOne({
    //   $and: [
    //     { therapistId: therapist_id },
    //     { specializationId: specialization_id }
    //   ]
    // });
    // monetization.count = monetization.count + 1;
    // await monetization.save();
    const message = `${user.firstName} ${user.lastName} has successfully booked a session.`;
    const subject = "Session Booking Confirmation";
    const htmlContent = sessionBookingConfirmation(`${user.firstName} ${user.lastName}`, `${therapist.firstName} ${therapist.lastName}`)
    await sendNotificationsAndEmails(user, therapist, htmlContent, message, subject);
    return res.status(200).json(new ApiResponse(200, session, "session booked successfully"))

  } catch (error) {
    console.log(error)
    res.status(500).json(new ApiError(500, "somthingwent wrong", [error]))
  }
})
export { sessionCompleted, rescheduleSession, bookSessionManully, getUserSessions, getTherapistSession, BookSessionFromCourse, manualSessionBooking }
