import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    content: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    replies: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);
export const Comment = mongoose.model("Comment", commentSchema);
