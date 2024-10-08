import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import { addDays, startOfDay } from "date-fns";
import ApiResponse from "../utils/ApiResponse.js";
import { Slot, TimeSlot } from "../models/slotModal.js";
import { Therapist } from "../models/therapistModel.js";

export const createSlots = async (request, response) => {
  let therapist_id = request?.user?._id;
  const { dates, timeslots, id } = request.body;
  if (id) therapist_id = new mongoose.Types.ObjectId(id);

  if (!dates || !therapist_id || !timeslots) {
    return response
      .status(400)
      .json(new ApiError(400, null, "All fields are required"));
  }
  // Check if therapist exists
  const therapist = await Therapist.findById(therapist_id);
  if (!therapist)
    return response
      .status(400)
      .json(new ApiError(400, null, "Invalid therapist"));

  const timeslotsArray = [];

  dates.forEach((date) => {
    timeslots.forEach((slot) => {
      timeslotsArray.push(
        new TimeSlot({
          date: date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: slot.isBooked,
          bookedBy: slot.bookedBy,
        })
      );
    });
  });

  let savedSlots;
  const therapistExist = await Slot.findOne({ therapist_id: therapist_id });
  if (therapistExist) {
    savedSlots = await Slot.updateOne(
      { therapist_id: therapist_id },
      { $push: { timeslots: { $each: timeslotsArray } } }
    );
  } else {
    const slotDocument = {
      timeslots: timeslotsArray,
      therapist_id: therapist_id,
    };
    const slot = new Slot(slotDocument);
    savedSlots = await slot.save();
  }

  return response
    .status(200)
    .json(new ApiResponse(200, savedSlots, "Slots created successfully"));
};

export const getNext10DaysSlots = async (request, response) => {
  try {
    let therapist_id = request?.user?._id;
    const id = request.params.id;
    if (id) therapist_id = new mongoose.Types.ObjectId(id);

    if (!therapist_id) {
      return response
        .status(400)
        .json(new ApiError(400, null, "Therapist ID is required"));
    }

    // Check if therapist exists
    const therapist = await Therapist.findById(therapist_id);
    if (!therapist) {
      return response
        .status(400)
        .json(new ApiError(400, null, "Invalid therapist"));
    }

    const today = startOfDay(new Date());
    const next10Days = addDays(today, id ? 180 : 14);
    const slots = await Slot.aggregate([
      {
        $match: {
          therapist_id: therapist_id,
          "timeslots.date": {
            $gte: today,
            $lte: next10Days,
          },
        },
      },
      { $unwind: "$timeslots" },
      {
        $match: {
          "timeslots.date": {
            $gte: today,
            $lte: next10Days,
          },
        },
      },
      {
        $sort: {
          "timeslots.date": 1,
        },
      },
      {
        $group: {
          _id: "$_id",
          timeslots: { $push: "$timeslots" },
        },
      },
    ]);

    if (!slots[0]?.timeslots.length) {
      return response
        .status(404)
        .json(
          new ApiResponse(404, null, "No slots available for the next 10 days")
        );
    }

    return response
      .status(200)
      .json(new ApiResponse(200, slots[0], "Slots fetched successfully"));
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .json(new ApiError(500, error.message, "Failed to fetch slots"));
  }
};

export const updateSlot = async (request, response) => {
  const { therapist_id, slot_id, updateData } = request.body;

  if (!therapist_id || !slot_id) {
    return response
      .status(400)
      .json(new ApiError(400, "Therapist ID and Slot ID are required"));
  }

  const slot = await Slot.findOneAndUpdate(
    {
      therapist_id: therapist_id,
      "timeslots._id": slot_id,
    },
    { $set: { "timeslots.$": updateData } }
  );

  if (!slot)
    return response.status(404).json(new ApiError(404, "Slot not found"));

  return response
    .status(200)
    .json(new ApiResponse(200, slot, "Slot updated successfully"));
};

export const deleteSlot = async (request, response) => {
  const { slot_id, therapist_id } = request.body;

  if (!slot_id || !therapist_id) {
    return response
      .status(400)
      .json({ error: "Slot ID and Therapist ID are required" });
  }

  try {
    const updatedData = await Slot.updateOne(
      { therapist_id: therapist_id, "timeslots._id": slot_id },
      { $pull: { timeslots: { _id: slot_id } } }
    );
    if (updatedData.modifiedCount > 0) {
      return response
        .status(200)
        .json({ message: "Slot deleted successfully", data: updatedData });
    } else {
      return response
        .status(404)
        .json({ error: "Slot not found or no changes made" });
    }
  } catch (error) {
    return response
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

export const addMoreSlots = async (req, res) => {
  const { date, startTime, endTime, therapist_id } = req.body;

  if (!date || !startTime || !endTime)
    return res.status(400).json(new ApiError(400, "All fields are required"));

  try {
    let slot = await Slot.findOne({ therapist_id: therapist_id });
    if (!slot) return res.status(404).json(new ApiError(404, "Slot not found"));

    const timeslot = slot.timeslots.filter(
      (ts) => ts.date.toISOString().split("T")[0] === date
    );

    if (!timeslot || timeslot.length === 0)
      return res.status(404).json(new ApiError(404, "No timeslot found"));

    // Check for conflicts with existing timeslots
    const hasConflict = timeslot.some(
      (ts) => startTime < ts.endTime && endTime > ts.startTime
    );

    if (hasConflict)
      return res
        .status(400)
        .json(new ApiError(400, "Timeslot conflicts with existing timeslots"));

    const timeSlotDoc = new TimeSlot({
      endTime,
      startTime,
      date: date,
      isbooked: false,
      bookedBy: null,
    });

    slot.timeslots.push(timeSlotDoc);
    await slot.save();
    return res
      .status(200)
      .json(new ApiResponse(200, slot, "Timeslot added successfully"));
  } catch (error) {
    console.error("Error adding timeslot:", error);
    return res
      .status(500)
      .json(new ApiError(500, null, "Internal server error"));
  }
};

export const getSlotsByDate = async (req, res) => {
  const { therapist_id, date } = req.params;

  if (!therapist_id || !date) {
    return res
      .status(400)
      .json(new ApiError(400, "Therapist ID and date are required"));
  }
  try {
    // Convert date to ISO format for comparison
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0); // Set time to 12:00 AM
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999); // Set time to 11:59 PM
    // const isoDate = new Date().toISOString().split("T")[0]; // Format date as YYYY-MM-DD

    // Find the Slot document for the given therapist_id and date
    const slot = await Slot.findOne({
      therapist_id: therapist_id,
      "timeslots.date": {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    if (!slot) {
      return res.status(404).json(new ApiError(404, "No slots found "));
    }

    // Filter timeslots for the specified date
    const slotsForDay = slot.timeslots.filter(
      (ts) => ts.date >= startOfDay && ts.date < endOfDay
    );

    return res
      .status(200)
      .json(new ApiResponse(200, slotsForDay, "Slots retrieved successfully"));
  } catch (error) {
    console.error("Error retrieving slots:", error);
    return res
      .status(500)
      .json(new ApiError(500, null, "Internal server error"));
  }
};
