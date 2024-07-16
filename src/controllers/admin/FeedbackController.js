import feedbackModel from "../../models/feedbackModel.js";
import ApiError from "../../utils/ApiError.js";
import AysncHandler from "../../utils/AysncHandler.js";
import { check, validationResult } from "express-validator";

const validateFeeback = [
    check("therepist_id", "Therepist id is required").notEmpty(),
    check("user_id", "User id is required").notEmpty(),
    check("star", "Star is required").notEmpty(),
    check("feeback", "feeback is required").notEmpty(),

]


const submitFeeback = AysncHandler(async (req, res) => {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(new ApiError(400, "", errors.array()));
    }
    const { therepist_id, user_id, star, feeback } = req.body;

});

export {submitFeeback , validateFeeback};