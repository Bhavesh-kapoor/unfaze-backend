import Category from "../../models/categoryModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AysncHandler from "../../utils/AysncHandler.js";


const allBlogCategory =  AysncHandler(async(req,res)=>{ 
    const getAllCategory =  await Category.find().sort({ _id: -1 });
    res.status(200).json(new ApiResponse(200,getAllCategory,"Category Found Successfull!"));
});

const createBlogCategory = AysncHandler(async (req, res) => {
    const { categoryname } = req.body;
    if(!categoryname){
        res.status(400).json(new ApiError(400,"","Blog Category Name is required"));
    }else{
        try{
            await Category.create({categoryname});
            res.status(200).json(new ApiResponse(200,"","Blog Category Has been created Successfully!"));

        }catch(err){
            res.status(500).json(new ApiError(500,"",err));
        }
    

    }

});

export {createBlogCategory,allBlogCategory};