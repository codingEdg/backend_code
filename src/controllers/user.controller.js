import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { validateEmail } from "../methods/email.validation.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUploadsCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { toBeDeletedAvatar } from "../utils/toBeDeletedAvatar.js";
import { deleteCoverImage } from "../utils/deleteCoverImage.js";

const testFunc = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(201, {}, "success full tested"));
});

const options = {
  httpOnly: true,
  secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
  // return res.status(200).json({ message: "ok - mehtab" })
  // steps to register the user
  // 1. get user details from postman (as detals are mentioned in user model file)
  // usually we get details from req.body or req.url so
  const { fullName, email, password, userName } = req.body;

  // validation
  // check if username or email or other details are empty or incoorrect
  // console.log({ email });
  // console.log(req.body);
  if (!validateEmail(email)) throw new ApiError(400, "invalid Email !!!");
  if (!userName) throw new ApiError(400, "Invalid user name");

  let isNotValid = [fullName, email, password, userName].some(
    (field) => field?.trim() === ""
  );
  if (isNotValid) {
    throw new ApiError(400, "All fields are required !!!");
  }

  // check if user is already exist : from username and email
  // if (!User) throw new ApiError(400, "user model file need to be debug");
  const existingUser = await User.findOne({
    $or: [{ userName: userName }, { email: email }],
  });
  if (existingUser) throw new ApiError(409, "User already Exist");

  // multer gives access of files like req.files
  // get filt path from req.files
  // console.log(req.files);
  const avatarLocalpath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  const coverImageLocalPath =
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
      ? req.files.coverImage[0].path
      : "";

  // let coverImageLocalPath;
  // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }

  // if avatarLocalPath is not found then throw error
  if (!avatarLocalpath) throw new ApiError(404, "Avatar file is required");

  // upload avator on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  // upload coverImage on cloudinary
  const coverImage =
    coverImageLocalPath && (await uploadOnCloudinary(coverImageLocalPath));

  // check avatar is uploaded on cloudinary or not if not then throw error
  if (!avatar) throw new ApiError(404, "Avatar file is required");

  // create user object : create entry in db
  const user = await User.create({
    fullName: fullName,
    email: email,
    password: password,
    userName: userName.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // check for user creation
  // when you get response then remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(500, "something went wrong while creating the User");

  // return user response
  return res
    .status(201)
    .json(
      new ApiResponse(200, createdUser, "User Registered SuccessFully !!!")
    );
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    // add refresh token to User
    user.refreshToken = refreshToken;

    // save user on database after adding refreshToken
    // also remove validation before save bcoz we are adding just refresh token not the whole user details
    // so it will check for all details if you don't remove the validation
    await user.save({ validateBeforeSave: false });
    return {
      accessToken,
      refreshToken,
    };
  } catch (err) {
    throw new ApiError(
      500,
      "something went wrong while generating Access and Refresh Tokens !!!"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // steps to login user
  // 1. get user details from postman (as detals are mentioned in user model file)
  // usually we get details from req.body or req.url so
  const { userName, email, password } = req.body;

  if (!(userName || email))
    throw new ApiError(400, "username or email is required");

  // find the user
  const user = await User.findOne({
    $or: [{ userName: userName }, { email: email }],
  });

  if (!user) throw new ApiError(404, "User does not exist");

  // check password or match password
  const isPasswordVaild = await user.isPasswordCorrect(password);

  if (!isPasswordVaild) throw new ApiError(401, "Incorrect Password");

  // generate access token and refresh refreshToken
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In SuccessFully !!!"
      )
    );
});

const loggedOutUser = asyncHandler(async (req, res) => {
  // steps to logout user
  // 1. get user details from postman (as detals are mentioned in user model file)

  await User.findByIdAndUpdate(
    req.user._id,
    {
      // set operate set mongoose things like refresh token etc
      // $set: { refreshToken: undefined }, [ this dosen't work currectly ]
      $unset: { refreshToken: 1 }, // this removes the refresh token field from the document
    },
    { new: true } // [ new means : in response we get new updated response in which we get refresh token undefined ]
  );

  return res
    .status(200)
    .clearCookie("accessToken", options) // clearCookie from cookieParser bcoz we need to clear the accessToken before user logout
    .clearCookie("refreshToken", options) // clearCookie from cookieParser bcoz we need to clear the refreshToken before user logout
    .json(new ApiResponse(200, {}, "User Logged Out SuccessFully !!!"));
});

// another controller for user end point for frontend side to refresh the access token to get login again
const refreshAccessToken = asyncHandler(async (req, res) => {
  // 1. get user details from postman (as detals are mentioned in user model file)
  // usually we get details from req.body or req.url so
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken)
    throw new ApiError(401, "Unauthorized Request detected !!!");

  try {
    // verify jwt using db token and the incomingRefreshToken
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // FIND USER FROM MONGOOSE DB BY ID
    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "invalid refresh token !!!");

    // check if incoming token and user.refresh token is equal. if not then throw error
    if (user.refreshToken !== incomingRefreshToken)
      throw new ApiError(401, "Refresh token is expired or used !!!");

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed SuccessFully !!!"
        )
      );
  } catch (err) {
    throw new ApiError(401, err.message || "invalid refresh token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  // take all required field from user (req.body)
  const { oldPassword, newPassword } = req.body;
  // console.log({ oldPassword });

  // bcoz user is loggedin, means midddleware had run then (req.user = user) so find the user from user._id
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(401, "Unauthorized Request detected !!!");

  // check if old password is correct or not
  const isPasswordVaild = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordVaild) throw new ApiError(401, "Incorrect old Password");

  // change password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  console.log("password changed");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed SuccessFully !!!"));
});

const getCurrentUser = asyncHandler(async (req, res, next) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: req.user },
        "User Details Fetched SuccessFully !!!"
      )
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // take all required field from user (req.body)
  const { fullName, userName, email } = req.body;
  if (!(userName && fullName && email))
    throw new ApiError(400, "All fields are required "); // 99 90 83 74 27

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        userName: userName,
        email: email,
        fullName: fullName,
      },
    },
    { new: true }
  ).select("-password");

  if (!user) throw new ApiError(400, "Given Crediential are invalid ");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Account Details Updated SuccessFully !!!")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // console.log(req.file.path)
  // take all required field from user (req.body)
  const avatarLocalpath = req.file?.path;
  if (!avatarLocalpath) throw new ApiError(404, "Avatar file is required");

  const avatar = await uploadOnCloudinary(avatarLocalpath);
  if (!avatar.url)
    throw new ApiError(400, "Error while uploading avatar on cloudinary");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  // toBeDeletedAvatar(avatarLocalpath);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated SuccessFully !!!"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  {
    // take all required field from user (req.body)
    const coverImageLocalpath = req.file?.path;
    if (!coverImageLocalpath)
      throw new ApiError(404, "cover Image file is missing");

    const coverImage = await uploadOnCloudinary(coverImageLocalpath);
    if (!coverImage.url)
      throw new ApiError(400, "Error while uploading coverImage on cloudinary");

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    ).select("-password");
    // deleteCoverImage(coverImageLocalpath);
    return res
      .status(200)
      .json(new ApiResponse(200, user, "cover Image Updated SuccessFully !!!"));
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // get user from url using req.params
  const { username } = req?.params;
  if (!username?.trim()) throw new ApiError(400, "username is missing");

  const channel = await User.aggregate([
    {
      // filter document
      $match: {
        userName: username?.toLowerCase(),
      },
    },
    {
      // get subscribers details
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "userId",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      // add additional fields to the object
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscribe"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // pass required details of object
      $project: {
        _id: 1,
        userName: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  console.log(channel);
  if (!channel?.length) throw new ApiResponse(400, "no channel found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channel[0],
        "Channel Details Fetched SuccessFully !!!"
      )
    );
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      // filter document
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      // get subscribers details
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            // just send first value {object} for the frontend devs
            $addFields: {
              owner: {
                $first: "$owner",
              },
              // owner: {
              //   userName: "$owner.userName",
              //   fullName: "$owner.fullName",
              //   avatar: "$owner.avatar",
              // },
            },
          },
        ],
      },
    },
  ]);

  if (!user?.length) throw new ApiResponse(400, "no user found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0],
        "User Watch History Fetched SuccessFully !!!"
      )
    );
});

export {
  testFunc,
  registerUser,
  loginUser,
  loggedOutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
