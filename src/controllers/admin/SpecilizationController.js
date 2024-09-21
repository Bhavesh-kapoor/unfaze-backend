import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AsyncHandler from "../../utils/asyncHandler.js";
import { Specialization } from "../../models/specilaizationModel.js";

// query that find all  spcializations
const getAllSpecialization = AsyncHandler(async (req, res) => {
  let specializations = await Specialization.find().sort({ _id: -1 });
  res.status(200).json(new ApiResponse(200, {result:specializations}));
});
const getSpecializationById = AsyncHandler(async (req, res) => {
  const { _id } = req.params
  let specialization = await Specialization.findById(_id);
  res.status(200).json(new ApiResponse(200, {result:specialization}));
});
const createSpecialization = AsyncHandler(async (req, res) => {
  const { name, usdPrice, inrPrice, description, isActive } = req.body;
  if (!name)
    res
      .status(400)
      .json(new ApiError(400, "", "Specialization name is required"));

  const createdExist = await Specialization.findOne({ name });
  if (createdExist) {
    return res.status(400).json(new ApiError(400, "", "Already created!"));
  }
  let isCreated = await Specialization.create({
    name,
    usdPrice,
    inrPrice,
    isActive,
    description,
  });
  if (isCreated) {
    res
      .status(200)
      .json(new ApiResponse(200, "Specilization has been created!"));
  } else {
    return res.status(400).json(new ApiError(400, "", "Something went wrong!"));
  }
});

const updateSpecialization = AsyncHandler(async (req, res) => {
  const { name, usdPrice, inrPrice, description, isActive } = req.body;
  const { _id } = req.params;

  if (!name || !_id) {
    return res
      .status(400)
      .json(new ApiError(400, "", "Name and specialization id are required!"));
  }

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new ApiError(400, "Invalid ObjectId");
  }

  let specialization = await Specialization.findById(_id);
  if (!specialization) {
    throw new ApiError(404, "Specialization not found");
  }

  specialization.name = name;
  specialization.usdPrice = usdPrice;
  specialization.inrPrice = inrPrice;
  specialization.isActive = isActive;
  specialization.description = description;
  await specialization.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        specialization,
        "Specialization Updated Successfully!"
      )
    );
});

const deleteSpecialization = AsyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id)
    return res.status(400).json(new ApiError(400, "Please pass object id "));

  if (!mongoose.Types.ObjectId.isValid(_id))
    return res.staus(400).json(400, "Invalid Object id");

  const deletedSpecialization = await Specialization.findByIdAndDelete(_id);
  if (!deletedSpecialization) {
    return res
      .status(400)
      .json(new ApiError(400, "", "Speclization Not found!"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "", "Speclization Deleted Successfully!"));
});

export {
  getAllSpecialization,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
  getSpecializationById
};
