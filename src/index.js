import dotenv from "dotenv";

dotenv.config({ path: "./.env" }); // this is where we define all .env configuration
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`🔌❄     Server is running on port : ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("Error : ", error);
      throw error;
    });
  })
  .catch((err) => console.log("mongoDB connection Failed !!!", err));

/*
    path to the .env file    (but it is in common js)
  require('dotenv').config({path:'/.env'}) --> this also will work fine but we will use modules instead of common js
  
import dotenv from 'dotenv'
dotenv.config({ path: '/.env' }) // this is where we define all .env configuration
*/
/*
this also needed to scripts in package.json file in order to use modules instead of common js :-
"dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"

*/

/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from 'express'

const app = express()
 the semicolon ; is because if there is some code before the iify function without semicolon then it can cause some sort of error
;(async ()=>{
try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
     express app can liston many events and to liston error we use app.on
    app.on("error",(error)=>{
        console.error({error})
        throw new Error(error)
    })
    app.listen(process.env.PORT,()=>{
        console.log(`server is running on port : ${process.env.PORT}`)
    })
} catch (error) {
        console.error({error})
        throw error
}   
})()
*/
