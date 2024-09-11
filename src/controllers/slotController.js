import ApiError from "../utils/ApiError.js";
import { addDays, startOfDay } from "date-fns";
import ApiResponse from "../utils/ApiResponse.js";
import { Slot, TimeSlot } from "../models/slotModal.js";
import { Therapist } from "../models/therapistModel.js";

export const createSlots = async (request, response) => {
  const therapist_id = request?.user?._id;
  const { dates, timeslots } = request.body;
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
    const slotDocument = new Slot({
      timeslots: timeslotsArray,
      therapist_id: therapist_id,
    });
    const slot = new Slot(slotDocument);
    savedSlots = await slot.save();
  }

  return response
    .status(200)
    .json(new ApiResponse(200, savedSlots, "Slots created successfully"));
};

export const getNext10DaysSlots = async (request, response) => {
  try {
    const therapist_id = request?.user?._id;

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
    const next10Days = addDays(today, 14);
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
        $group: {
          _id: "$_id",
          timeslots: { $push: "$timeslots" }, // Reassemble the timeslots array
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
      .json(new ApiError(400, "Slot ID and Therapist ID are required"));
  }

  const slot = await Slot.findOne({
    therapist_id: therapist_id,
    "timeslots._id": slot_id,
  });

  if (!slot) {
    return response.status(404).json(new ApiError(404, "Slot not found"));
  }

  // Remove the slot from the timeslots array
  const updatedData = await Slot.updateOne(
    { therapist_id: therapist_id },
    { $pull: { timeslots: { _id: slot_id } } }
  );

  return response
    .status(200)
    .json(new ApiResponse(200, updatedData, "Slot deleted successfully"));
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
    const isoDate = new Date(date).toISOString().split("T")[0]; // Format date as YYYY-MM-DD

    // Find the Slot document for the given therapist_id and date
    const slot = await Slot.findOne({
      therapist_id: therapist_id,
      "timeslots.date": isoDate,
    });

    if (!slot) {
      return res.status(404).json(new ApiError(404, "No slots found "));
    }

    // Filter timeslots for the specified date
    const slotsForDate = slot.timeslots.filter(
      (ts) => ts.date.toISOString().split("T")[0] === isoDate
    );

    return res
      .status(200)
      .json(new ApiResponse(200, slotsForDate, "Slots retrieved successfully"));
  } catch (error) {
    console.error("Error retrieving slots:", error);
    return res
      .status(500)
      .json(new ApiError(500, null, "Internal server error"));
  }
};
