import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // take token from req.cookie and req.header
    const token =
      (await req.cookies?.accessToken) ||
      (await req.header("Authorization")?.replace("Bearer ", ""));

    if (!token) throw new ApiError(401, "Unauthorized Access");

    // verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // get user from token
    const user = User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Invalid Access token");

    // save user in req.user
    req.user = user;

    // user is verified now proceed further
    next();
  } catch (err) {
    throw new ApiError(401, err?.message || "invalid access token");
  }
});
