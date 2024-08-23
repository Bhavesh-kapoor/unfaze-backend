import mongoose from "mongoose";
import { Faq } from "../../models/faqModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AysncHandler from "../../utils/asyncHandler.js";

import { check, validationResult } from 'express-validator';
const validateFaq = [
    check('question', 'Question is required').notEmpty(),
    check('answer', 'Answer is required').notEmpty(),
    check('url', 'Page url  is required').notEmpty(),
]

const store = AysncHandler(async (req, res) => {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(new ApiError(400, "", errors.array()));
    } else {
        // now store the data in the faq mode
        const { question, answer, url } = req.body;
        const saveFaq = await Faq.create({
            question,
            answer,
            url
        });
        if (saveFaq) {
            res.status(200).json(new ApiResponse(200, saveFaq, 'Faq Saved Successfully!'));
        } else {
            res.status(500).json(new ApiError(500, "", 'Something Went Wrong while saving the faq!'));

        }

    }


});

const read = AysncHandler(async (req, res) => {
    const allFaq = await Faq.find();
    res.status(200).json(new ApiResponse(200, allFaq, 'Faq Data Successfully!'));

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
                return res.status(400).json(new ApiResponse(200, "", "Faq Deleted Successfully!"));

            } else {
                res.status(500).json(new ApiError(500, "", 'Something Went Wrong while deleting the faq!'));

            }
        }
    }


});


const activeOrDeactivate = AysncHandler(async (req, res) => {
    const { _id } = req.params;
    if (!_id) {
        res.status(401).json(new ApiError(401, "", "Please pass id"));
    } else {
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json(new ApiError(401, "", "Invalid Object id"));
        } else {
            const findBy = await Faq.findById({ _id });
            console.log(findBy);
            let activate = 1;
            let message = "Faq Activated Successfully!";

            if (findBy.is_active == 1) {
                activate = 0;
                message = "Faq Deactivated Successfully!";
            }
            const update = await Faq.findByIdAndUpdate(_id, { is_active: activate }, { new: true });

            if (update) {
                return res.status(400).json(new ApiResponse(200, update, message));

            } else {
                res.status(500).json(new ApiError(500, "", 'Something Went Wrong while deleting the faq!'));

            }
        }
    }


});

const edit = AysncHandler(async (req, res) => {
    const { _id } = req.params;
    if (!_id) {
        res.status(401).json(new ApiError(401, "", "Please pass id"));
    } else {
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json(new ApiError(401, "", "Invalid Object id"));
        } else {
            const getdata = await Faq.findById({ _id });


            if (getdata) {
                return res.status(400).json(new ApiResponse(200, getdata, "Fetched Particular api"));

            } else {
                res.status(500).json(new ApiError(500, "", 'Something Went Wrong while deleting the faq!'));

            }
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
            const { question, answer, url } = req.body;
            const getdata = await Faq.findById({ _id });
            getdata.question = question;
            getdata.answer = answer;
            getdata.url = url;
            getdata.save();


            if (getdata) {
                return res.status(200).json(new ApiResponse(200, getdata, "FAQ updated successfully"));

            } else {
                res.status(500).json(new ApiError(500, "", 'Something Went Wrong while Updating the faq!'));

            }
        }
    }


});
export { store, validateFaq, read, deleteFaq, activeOrDeactivate, edit  , update};