import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const videoSchema = new Schema({
    videoFile: {
        type: String, // cloudinary url
        required: true
    },
    thumb: {
        type: String, // cloudinary url
        required: true
    },
    title: {
        type: String, // cloudinary url
        required: true
    },
    duration: {
        type: String, // cloudinary url
        required: true
    },
    views: {
        type: String,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    tags: {
        type: [String],
        required: true
    },

}, { timestamps: true })


videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)