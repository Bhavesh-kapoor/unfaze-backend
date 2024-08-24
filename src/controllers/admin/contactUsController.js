import { ContactUS } from "../../models/contactUs.model.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { isValidObjectId } from "../../utils/mongooseUtility.js";
import { contactUsContent } from "../../static/emailcontent.js";
import { transporter, mailOptions } from "../../config/nodeMailer.js";

const raiseQuery = asyncHandler(async (req, res) => {
    const { senderName, senderEmail, query } = req.body
    if ([senderName, senderEmail, query].some((field) => field?.trim() === "")) {
        return res.status(400).json(new ApiError(400, "", "all fields are mandetory"))
    }
    const raisedQuery = await ContactUS.create({ senderName, senderEmail, query });
    if (!raisedQuery) {
        return res.status(200).json(new ApiError(500, "", "something went wrongwhile raising query! "))
    }
    /*--------------------------------send mail notification to admin--------------------------------------------------*/
    const htmlContent = contactUsContent(senderName, senderEmail, query);
    const options = mailOptions(senderEmail, "Query raised from unfazed user", htmlContent)
    transporter.sendMail(options, (error, info) => {
        if (error) {
            console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        return res.status(200).json(new ApiResponse(200, {data:raisedQuery,messageID:info.messageId}, "Query raised successfully!"))
    })
})

const changeQueryStatus = asyncHandler(async (req, res) => {
    const { _id } = req.params;
    const {status}=req.body;
    if (!isValidObjectId(_id)) {
        return res.status(500).json(new ApiError(500, "", "invalid object id!"))
    }
    const query = await ContactUS.findByIdAndUpdate({ _id },{status}, { new: true });
    if (!query) { return res.status(404).json(new ApiError(404, "", "invalid query request!")) }
    return res.status(200).json(new ApiResponse(200, { result: query }, "Query status changed successfully!"))
})

const getQueryList = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        sort = "createdAt",
        order = "desc",
    } = req.query;
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const queryList = await ContactUS.find()
        .sort({ [sort]: order === "desc" ? -1 : 1 })
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)
        .exec();
    const totalCount = await ContactUS.countDocuments();
    const pagination = {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        itemsPerPage: limitNumber,
    };
    if (pagination.currentPage > pagination.totalPages) {
        return res.status(404).json(new ApiError(404, "", "No data found for this page!"))
    }
    if (!queryList.length) {
        return res.status(404).json(new ApiError(404, "", "Failed to retrive query list!"))
    }
    return res.status(200).json(new ApiResponse(200, { result: queryList, pagination }))
})

export { raiseQuery, changeQueryStatus, getQueryList }
