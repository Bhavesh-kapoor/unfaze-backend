import ApiError from "../../utils/ApiError.js";
import { TherepisetModel } from "../../models/therepistModel.js";
import { check, validationResult } from 'express-validator';

import AysncHandler from "../../utils/AysncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";


const validateRegister = [
    check('firstName', 'First Name is required').notEmpty(),
    check('lastName', 'Last Name is required').notEmpty(),
    check('email', 'Email is required').isEmail(),
    check('mobile', 'Mobile is required').notEmpty(),
    check('specailization', 'Specailization is required').notEmpty(),
    check('gender', 'Gender is required').notEmpty(),
];

const register = AysncHandler(async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(await new ApiError(400, "Validation Error", errors.array()));
    }
    const { firstName, lastName, email, mobile, gender, education, licenese, specailization, bio, state, city, pincode, completeAddress, linkedin, facebook, highSchool, intermediate, graduation, postgraduation, additional, language, experience, instagram, bankName, ifsccode, accoundNumber, accountHolder } = req.body;

    const therepistdata = { firstName, lastName, email, mobile, gender, experience };
    therepistdata.address = {};
    therepistdata.social = {};
    therepistdata.education = {};
    therepistdata.bankdetail = {};
    if (highSchool) {
        therepistdata.education.highSchool = highSchool;
    }
    if (intermediate) {
        therepistdata.education.intermediate = intermediate;
    }
    if (graduation) {
        therepistdata.education.graduation = graduation;
    }
    if (postgraduation) {
        therepistdata.education.postgraduation = postgraduation;
    }
    if (additional) {
        therepistdata.education.additional = additional;
    }
    if (licenese) {
        therepistdata.licenese = licenese;
    }
    if (experience) {
        therepistdata.experience = experience;
    }
    if (state) {
        therepistdata.address.state = state;
    }
    if (city) {
        therepistdata.address.city = city;
    }

    if (pincode) {
        therepistdata.address.pincode = pincode;
    }
    if (completeAddress) {
        therepistdata.address.completeAddress = completeAddress;
    }
    if (linkedin) {
        therepistdata.social.linkedin = linkedin;
    }
    if (instagram) {
        therepistdata.social.instagram = instagram;
    }
    if (facebook) {
        therepistdata.social.facebook = facebook;
    }
    if (bankName) {
        therepistdata.bankdetail.bankName = bankName;
    }
    if (ifsccode) {
        therepistdata.bankdetail.ifsccode = ifsccode;
    }
    if (accountHolder) {
        therepistdata.bankdetail.accountHolder = accountHolder;
    }
    if (accoundNumber) {
        therepistdata.bankdetail.accoundNumber = accoundNumber;
    }
    if (bio) {
        therepistdata.bio = bio;
    }
    if (specailization) {
        // check if it is array or not
        if (Array.isArray(specailization) === false) {
            return res.status(400).json(new ApiError(400, "", "Speclization Should be array !"));
        }
        
        therepistdata.specailization = specailization;
    }

    if (language) {
        // check if it is array or not 
        if (!Array.isArray(language)) {
            res.status(400).json(new ApiError(400, '', "Language should be array!"));
        }
        therepistdata.language = language;
    }

    // passport 

    try {

        // check if it the email or mobile already exist 
        let checkExist = await TherepisetModel.find({ $or: [{ mobile }, { email }] });
        if (checkExist.length > 0) {
            res.status(400).json(new ApiError(400, "", "You are already exist!"));
        }
        therepistdata.bankdetail = {};

        if (req.files) {
            if (req.files.passport) {
                therepistdata.bankdetail.passport = req.files.passport[0].path;
            }

            if (req.files.adharcard) {
                therepistdata.bankdetail.adharcard = req.files.adharcard[0].path;
            }

            if (req.files.pancard) {
                therepistdata.bankdetail.pancard = req.files.pancard[0].path;
            }
        }
        let createTherepist = new TherepisetModel(therepistdata);
        await createTherepist.save();
        res.status(200).json(new ApiResponse(200, "", "Therepist createdSuccessfully"));

    }
    catch (err) {
        res.status(500).json(new ApiError(500, "", err.message));
    }






    // inser

});


export { register, validateRegister };