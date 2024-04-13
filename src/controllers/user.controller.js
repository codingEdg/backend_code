import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { validateEmail } from "../methods/email.validation.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUploadsCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

const loginUser = asyncHandler(async (req, res) => {});

export { registerUser };
