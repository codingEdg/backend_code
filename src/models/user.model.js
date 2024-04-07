import mongoose, { Schema } from 'mongoose'
import { Jwt } from 'jsonwebtoken'
import bcrypt from "bcrypt"

const userSchema = new Schema({
    id: { type: String, required: true },
    userName: { type: String, required: true, unique: true, lowsercase: true, trim: true, index: true },
    fullName: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowsercase: true, trim: true, },
    password: { type: String, required: [true, "Password is Required"] },
    coverImage: { type: String, required: true }, // from cloudinary database
    avatar: { type: String, required: true },
    coverImage: { type: String, required: true },
    refreshToken: { type: String, required: true },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video", required: true }],

}, { timestamps: true })
// this pre mongoose middleware allow use to do some task on some events like validate, save, remove, deleteOne, updateOne etc. read mongoose middleware for more info
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = bcrypt.hash(this.password, 10)
    next()
})


// making self middleware method to check password is correct or not

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    const token = Jwt.sign({ _id: this._id, email: this.email, userName: this.userName, fullName: this.fullName }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })
    return token
}
userSchema.methods.generateRefreshToken = function () {
    const token = Jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFERESH_TOKEN_EXPIRY })
    return token
}

export const User = mongoose.model('User', userSchema)
