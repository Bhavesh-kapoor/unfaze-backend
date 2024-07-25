import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import AysncHandler from "../../utils/asyncHandler.js";
import { User } from "../../models/userModel.js";
import jwt from "jsonwebtoken";

const createAccessOrRefreshToken = async (user_id) => {
  const user = await User.findById(user_id);
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};
const login = AysncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    return res
      .status(409)
      .json(new ApiError(400, "", "Please pass username or email"));
  }

  let existUser = await User.findOne({ $and: [{ email }, { role: "admin" }] });
  if (!existUser)
   return res.status(400).json(new ApiError(400, "", "Email Not Found!"));

  // now check password is correct  or not
  const isPasswordCorrect = await existUser.isPasswordCorrect(password);
  if (!isPasswordCorrect)
   return res.status(401).json(new ApiError(401, "", "Invalid Credentials!"));

  // generate token
  let { accessToken, refreshToken } = await createAccessOrRefreshToken(
    existUser._id
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  const LoggedInUser = await User.findById(existUser._id).select(
    "-password -refreshToken"
  );
 return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: LoggedInUser,
      })
    );
});

const register = AysncHandler(async (req, res) => {
  const { email, password, mobile, name, role } = req.body;
  if (!email || !password || !mobile || !name || !role) {
   return res.status(400).json(new ApiError(400, "", "Please Provide all feilds!"));
  }

  const allowedRule = ["user", "admin"];
  if (!allowedRule.includes(role)) {
   return res
      .status(400)
      .json(
        new ApiError("400", "", "Roles must be a user or admin")
      );
  }

  if (role == "user") {
    const { dob, gender, education, license, role } = req.body;
  }
  const exist = await User.findOne({ email });
  if (exist) {
  return  res
      .staus(409)
      .json(
        new ApiError(409, "User with username or email is already exsist")
      );
  }
  const createUser = await User.create({
    email: email,
    password: password,
    name: name,
    mobile: mobile,
    role: role,
  });
 return res
    .status(200)
    .json(new ApiResponse(200, createUser, "User created successfully"));
});

const refreshToken = AysncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken)
    res.status(400).json(new ApiError(400, "", "Pleass Pass refresh token!"));
  // now verify the jwt token
  const decodedToken = await jwt.verify(
    incommingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const getUserinfo = await User.findById(decodedToken?._id);
  if (!getUserinfo) res.status(400).json(new ApiError(400, "", "Invaid User"));

  if (getUserinfo?.refreshToken !== incommingRefreshToken) {
    res
      .status(401)
      .json(new ApiError(401, "", "Token has been expired or used"));
  }
  const options = {
    httpOnly: true,
    secure: true,
  };

  // now create token
  const { accessToken, refreshToken } = createAccessOrRefreshToken(
    getUserinfo?._id
  );
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: LoggedInUser,
      })
    );
});

const googleAuth =async (token, tokenSecret, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = new User({
        googleId: profile.id,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
      });
      await user.save();
    }
    done(null, therapist);
  } catch (err) {
    done(err, null);
  }
}

export { login, register, refreshToken,googleAuth };
