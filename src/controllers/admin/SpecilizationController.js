import { SpecializationModel } from "../../models/specilaizationModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AysncHandler from "../../utils/AysncHandler.js";


const getAllSpeziliation = AysncHandler(async (req, res) => {
    // query that find all  spcializations
    let Specialization = await SpecializationModel.find().sort({ _id: -1 });
    res.status(200).json(new ApiResponse(200, Specialization));
});


const createSpecilization = AysncHandler(async (req, res) => {
    const { name } = req.body
    if (!name) res.status(400).json(new ApiError(400, "", "Specilization name is required"));

    const createdExist = SpecializationModel.findOne({ name });
    if (createdExist) res.status(400).json(new ApiError(400, "", "Already created!"))

    let isCreated = await SpecializationModel.create({ name });

    if (isCreated) {
        res.status(200).json(new ApiResponse(200, "Specilization has been created!"));
    } else {
        res.status(400).json(new ApiError(400, "", "Something went wrong!"));

    }



    console.log(isCreated);

})

export { getAllSpeziliation, createSpecilization };