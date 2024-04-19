import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
    // owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // dislikes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tweet: [{ type: Schema.Types.ObjectId, ref: "Tweet" }],
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
