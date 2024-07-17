import mongoose from "mongoose";
import { Specialization } from "../../models/specilaizationModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AysncHandler from "../../utils/AysncHandler.js";


const getAllSpeziliation = AysncHandler(async (req, res) => {
    // query that find all  spcializations
    let Specialization = await Specialization.find().sort({ _id: -1 });
    res.status(200).json(new ApiResponse(200, Specialization));
});


const createSpecilization = AysncHandler(async (req, res) => {
    const { name } = req.body
    if (!name) res.status(400).json(new ApiError(400, "", "Specilization name is required"));

    const createdExist = await Specialization.findOne({ name });
    if (createdExist) {

        res.status(400).json(new ApiError(400, "", "Already created!"));
    }
    let isCreated = await Specialization.create({ name });

    if (isCreated) {
        res.status(200).json(new ApiResponse(200, "Specilization has been created!"));
    } else {
        res.status(400).json(new ApiError(400, "", "Something went wrong!"));
    }

})


const updateSpecilization = AysncHandler(async (req, res) => {
    const { name, id } = req.body;
    if (!name || !id) {
        res.status(400).json(new ApiError(400, '', "Name and object id is required!"));
    }
    if(!mongoose.Types.ObjectId.isValid(id)){
        res.status(400).json(new ApiError(400 ,"","Invalid ObjectId"));
    }
    let Specilization = await Specialization.findById(id);   
    Specilization.name =  name; 
    await Specilization.save();

    res.status(200).json(new ApiResponse(200,Specilization,"Speclization Updated Successfully!"));

})

const deleteSpeclization =  AysncHandler(async(req,res)=>{
    const { id} =  req.body;
    if(!id) res.status(400).json(new ApiError(400,"","Please pass object id "));
    if(!mongoose.Types.ObjectId.isValid(id)) res.staus(400).json(400,"","Invalid Object id");
 const deletedSpecialization =   await   Specialization.findByIdAndDelete(id);
 if(!deletedSpecialization ){
    res.status(400).json(new ApiError(400,"","Speclization Not found!"))
 }
    res.status(200).json(new ApiResponse(200,"","Speclization Deleted Successfully!"));

})

export { getAllSpeziliation, createSpecilization, updateSpecilization,deleteSpeclization };