import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Therapist } from "../../models/therapistModel.js";
import  Blog  from "../../models/blogsModel.js"

const therapistList = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortkey = "createdAt",
    sortdir = "desc",
  } = req.query;

  // Pagination
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const pipeline = [
    {
      $lookup: {
        from: "specializations",
        localField: "specialization",
        foreignField: "_id",
        as: "specializationDetails",
      },
    },
    {
      $sort: { [sortkey]: sortdir === "desc" ? -1 : 1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limitNumber,
    },
    {
      $project: {
        _id: 1,
        profileImage: 1,
        name: { $concat: ["$firstName", " ", "$lastName"] },
        email: 1,
        is_email_verified: 1,
        is_active: 1,
        createdAt: 1,
        specializationDetails: {
          $map: {
            input: "$specializationDetails",
            as: "specialization",
            in: {
              _id: "$$specialization._id",
              name: "$$specialization.name",
            },
          },
        },
      },
    },
  ];

  const therapistListData = await Therapist.aggregate(pipeline);

  // Add count stage to get total number of therapists
  const countPipeline = [
    { $count: "totalCount" }
  ];

  const countResult = await Therapist.aggregate(countPipeline);
  const totalTherapists = countResult.length > 0 ? countResult[0].totalCount : 0;

  if (!therapistListData.length) {
    return res.status(404).json(new ApiError(404, "", "No therapists found!"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        pagination: {
          totalItems: totalTherapists,
          totalPages: Math.ceil(totalTherapists / limitNumber),
          currentPage: pageNumber
        },
        result: therapistListData,
      },
      "Therapist list fetched successfully"
    )
  );
});

const therapistListByGroup = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortkey = "specializationName",
    sortdir = "asc",
  } = req.query;

  // Pagination
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Aggregation pipeline to group therapists by specialization
  const pipeline = [
    {
      $lookup: {
        from: "specializations",
        localField: "specialization",
        foreignField: "_id",
        as: "specializationDetails",
      },
    },
    {
      $unwind: "$specializationDetails",
    },
    {
      $group: {
        _id: "$specializationDetails.name",
        therapists: {
          $push: {
            _id: "$_id",
            profileImage: "$profileImage",
            name: { $concat: ["$firstName", " ", "$lastName"] },
            email: "$email",
            is_email_verified: "$is_email_verified",
            is_active: "$is_active",
            createdAt: "$createdAt",
            specialization: {
              _id: "$specializationDetails._id",
              name: "$specializationDetails.name",
            },
          },
        },
      },

    },

    {
      $sort: { [sortkey]: sortdir === "desc" ? -1 : 1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limitNumber,
    },
    {
      $project: {
        _id: 0,
        specializationName: "$_id",
        therapists: 1,
      },
    },
  ];

  // Fetch paginated grouped data
  const therapistListData = await Therapist.aggregate(pipeline);

  // Add count stage to get total number of groups
  const countPipeline = [
    {
      $lookup: {
        from: "specializations",
        localField: "specialization",
        foreignField: "_id",
        as: "specializationDetails",
      },
    },
    {
      $unwind: "$specializationDetails",
    },
    {
      $group: {
        _id: "$specializationDetails.name",
        totalCount: { $sum: 1 },
      },
    },
    {
      $count: "totalCount",
    },
  ];

  const countResult = await Therapist.aggregate(countPipeline);
  const totalGroups = countResult.length > 0 ? countResult[0].totalCount : 0;

  if (!therapistListData.length) {
    return res.status(404).json(new ApiError(404, "", "No therapists found!"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        pagination: {
          totalItems: totalGroups,
          totalPages: Math.ceil(totalGroups / limitNumber),
          currentPage: pageNumber
        },
        result: therapistListData,
      },
      "Therapist list fetched successfully"
    )
  );
});

const findBolgbySlug = asyncHandler(async (req, res) => {
  const { slug } = req.query;
  if (!slug) {
    throw new ApiError(400, "", "slug is required!")
  }
  const blog = await Blog.findOne({ slug })
  if (!blog) {
    throw new ApiError(404, "", "Blog not found!")
  }
  return res.status(200).json(new ApiResponse(200, blog, "Blog fetched succsessfully!"))
})
export { therapistList, therapistListByGroup, findBolgbySlug }