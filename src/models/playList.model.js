import mongoose, { Schema } from "mongoose";

const playListSchema = new Schema(
  {
    name: { type: String, req: true },
    discription: { type: String, req: true },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const PlayList = mongoose.model("PlayList", playListSchema);
