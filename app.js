import express from "express";
import morgan from "morgan";
import xss from "xss";
import cors from 'cors'
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import bodyParser from "body-parser";

const app = express()

// app.use(xss())

app.use(cors({
    origin : "*",
    methods:["GET","POST","PUT","PATCH","DELETE"],
    credentials:true
}));
app.use(express.json({limit:"20kb"}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))

app.use(helmet())

if (process.env.NODE_ENV === "developement") {
    app.use(morgan('dev'))  
}

const limiter = rateLimit({
    max:3000,
    windowMs: 60 * 60 * 1000, // equivalent to 1 hr
    message:"IP blocked for excessive requests. Retry in 1 hour."
})

app.use("/tawk",limiter)

app.use(express.urlencoded({
    extended:true
}))

app.use(ExpressMongoSanitize());



export default app;