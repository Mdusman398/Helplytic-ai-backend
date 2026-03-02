import express from "express"
import "dotenv/config"
import connectDb from "./config/db.js"
import userRouter from "./routes/userRoute.js"
import cookieParser from "cookie-parser"
import cors from "cors"
const app = express()
app.use(express.json())
const PORT = process.env.PORT
const corsOptions = {
  origin: process.env.FRONTEND_URL, 
  credentials: true,               
};

app.use(cors(corsOptions));
app.use(cookieParser())

connectDb()
app.use("/api", userRouter)
app.get("/", (req,res) => {
    res.send({message: "hello world"})
})
app.listen(PORT, ()=>{
    console.log(`server is running on http://localhost:${PORT}`);
    
})