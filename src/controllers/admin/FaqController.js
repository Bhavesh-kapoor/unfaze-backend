import mongoose from "mongoose";
import { Faq } from "../../models/faqModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AysncHandler from "../../utils/asyncHandler.js";

import { check, validationResult } from "express-validator";
const validateFaq = [
  check("question", "Question is required").notEmpty(),
  check("answer", "Answer is required").notEmpty(),
  check("url", "Page url  is required").notEmpty(),
];

const store = AysncHandler(async (req, res) => {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(new ApiError(400, "", errors.array()));
  } else {
    const { question, answer, url } = req.body;
    const saveFaq = await Faq.create({
      question,
      answer,
      url,
    });
    if (saveFaq) {
      res
        .status(200)
        .json(new ApiResponse(200, saveFaq, "Faq Saved Successfully!"));
    } else {
      res
        .status(500)
        .json(
          new ApiError(500, "", "Something Went Wrong while saving the faq!")
        );
    }
  }
});

const read = AysncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
    url,
  } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  let query = {};
  if (url) {
    query.url = { $regex: url, $options: "i" };
  }

  const allFaq = await Faq.find(query)
    .sort({ [sort]: order === "desc" ? -1 : 1 })
    .limit(limitNumber)
    .skip((pageNumber - 1) * limitNumber)
    .exec();

  const totalCount = await Faq.countDocuments(query);

  const pagination = {
    currentPage: pageNumber,
    totalPages: Math.ceil(totalCount / limitNumber),
    totalItems: totalCount,
    itemsPerPage: limitNumber,
  };

  if (pagination.currentPage > pagination.totalPages) {
    return res
      .status(404)
      .json(new ApiError(404, "", "No data found for this page!"));
  }

  if (!allFaq.length) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Failed to retrieve query list!"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { result: allFaq, pagination },
        "Fetched FAQ Data Successfully!"
      )
    );
});

const deleteFaq = AysncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    res.status(401).json(new ApiError(401, "", "Please pass id"));
  } else {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json(new ApiError(401, "", "Invalid Object id"));
    } else {
      const deleteit = await Faq.findByIdAndDelete(_id);
      if (deleteit) {
        return res
          .status(200)
          .json(new ApiResponse(200, "", "Faq Deleted Successfully!"));
      } else {
        res
          .status(500)
          .json(
            new ApiError(
              500,
              "",
              "Something Went Wrong while deleting the faq!"
            )
          );
      }
    }
  }
});

const getById = AysncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json(new ApiError(401, "", "Invalid Object id!"));
  } else {
    const getdata = await Faq.findById({ _id });

    if (getdata) {
      return res
        .status(200)
        .json(new ApiResponse(200, getdata, "Faq fached successfully!"));
    } else {
      res
        .status(500)
        .json(
          new ApiError(500, "", "Something Went Wrong while deleting the faq!")
        );
    }
  }
});

const update = AysncHandler(async (req, res) => {
  const { _id } = req.body;
  if (!_id) {
    res.status(401).json(new ApiError(401, "", "Please pass id"));
  } else {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json(new ApiError(401, "", "Invalid Object id"));
    } else {
      const { question, answer, url, isActive } = req.body;
      const getdata = await Faq.findById(_id);
      getdata.question = question;
      getdata.answer = answer;
      getdata.url = url;
      getdata.isActive = isActive;

      await getdata.save();
      if (getdata) {
        return res
          .status(200)
          .json(new ApiResponse(200, getdata, "FAQ updated successfully"));
      } else {
        res
          .status(500)
          .json(
            new ApiError(
              500,
              "",
              "Something Went Wrong while Updating the faq!"
            )
          );
      }
    }
  }
});
export { store, validateFaq, read, deleteFaq, getById, update };
