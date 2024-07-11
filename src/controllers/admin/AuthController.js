import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AysncHandler from "../../utils/AysncHandler.js"

const login = AysncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (email != '' && password != '') {
        return res.status(409).json(new ApiError(400, "", "Please pass username or email"));
    }





    res.status(200).json(new ApiResponse(200, '', 'tEST lOFIN'));

});


export { login };