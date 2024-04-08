import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return "could not find the path"
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log(`file is uploaded on cloudinary. URL : ${response.url}`);
        return response;
    } catch (error) {
        fs.unlink(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        console.log(`Error!!! : ${error}`)
        return null
    }
}

export default uploadOnCloudinary;

cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
    { public_id: "olympic_flag" },
    function (error, response) { console.log(response); });