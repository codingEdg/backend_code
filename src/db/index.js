import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // bcoz there can be many connection/ hosts so
        // just to check that -> on which host i am gonna connect on  !
        console.log(`/n Connected to MongoDB !!! DB HOST : ${connectionInstance.connection.host}`)
    } catch (err) {
        console.log(`MONGO-DB connection Error : ${err}`)
        process.exit(1)
    }
}

export default connectDB;