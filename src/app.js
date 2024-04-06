import express, { json, urlencoded } from "express"
import cookieParser from "cookie-parser"
import cors from 'cors'

const app = express()
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }
))
app.use(json(
    {
        verify: (req, res, buf) => {
            req.rawBody = buf.toString()
        },
        limit: '16mb',
        extended: true,
        parameterLimit: 50000,
    }

))
app.use(urlencoded(
    {
        limit: '16mb',
        extended: true,
        parameterLimit: 50000,
    }
))
app.use(express.static("public"))
app.use(cookieParser())
export { app }

