import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AysncHandler from "../../utils/AysncHandler.js";
import { User } from "../../models/userModel.js";
import jwt from "jsonwebtoken";


const createAccessOrRefreshToken = async (user_id) => {
    const user = await User.findById(user_id);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };



}
const login = AysncHandler(async (req, res) => {

    const { email, password } = req.body;
    if (!email && !password) {
        return res.status(409).json(new ApiError(400, "", "Please pass username or email"));
    }

    let existUser = await User.findOne({ $and: [{ email }, { role: 'admin' }] });
    if (!existUser) res.status(400).json(new ApiError(400, "", "Email Not Found!"));

    // now check password is correct  or not 
    const isPasswordCorrect = await existUser.isPasswordCorrect(password);
    if (!isPasswordCorrect) res.status(401).json(new ApiError(401, "", "Invalid Credentials!"));

    // generate token 
    let { accessToken, refreshToken } = await createAccessOrRefreshToken(existUser._id);
    const options = {
        httpOnly: true,
        secure: true
    }

    const LoggedInUser = await User.findById(existUser._id).select('-password -refreshToken');
    res.status(200).cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options).json(new ApiResponse(200, { accessToken: accessToken, refreshToken: refreshToken, user: LoggedInUser }));

});

const register = AysncHandler(async (req, res) => {
    const { email, password, mobile, name, role } = req.body;
    if (!email || !password || !mobile || !name || !role) {
        res.status(400).json(new ApiError(400, "", "Please Provide all feilds!"))
    }

    const allowedRule = ['user', 'admin', 'therapist']
    if (!allowedRule.includes(role)) {
        res.status(400).json(new ApiError("400", "", "Roles can be user , admin and therapist!"));
    }

    if (role == 'therapist') {
        const { dob, gender, education, license, role } = req.body;

    }

    const exist = await User.findOne({ email });
    if (exist) {
        res.staus(409).json(new ApiError(409, "Unique with username or email is already required!"));
    }
    const createUser = await User.create({
        email: email,
        password: password,
        name: name,
        mobile: mobile,
        role: role,
    });
    res.status(200).json(new ApiResponse(200, createUser, "User created successfully"));
});



const refreshToken = AysncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incommingRefreshToken) res.status(400).json(new ApiError(400, "", "Pleass Pass refresh token!"));
    // now verify the jwt token 
    const decodedToken = await jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const getUserinfo = await User.findById(decodedToken?._id);
    if (!getUserinfo) res.status(400).json(new ApiError(400, "", "Invaid User"));

    if (getUserinfo?.refreshToken !== incommingRefreshToken) {
        res.status(401).json(new ApiError(401, "", "Token has been expired or used"));
    }
    const options = {
        httpOnly: true,
        secure: true
    }

    // now create token 
     const {accessToken, refreshToken} =  createAccessOrRefreshToken(getUserinfo?._id);
     res.status(200).cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options).json(new ApiResponse(200, { accessToken: accessToken, refreshToken: refreshToken, user: LoggedInUser }));
    });






export { login, register ,refreshToken};