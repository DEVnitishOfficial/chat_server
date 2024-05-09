import { Route } from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js"


const router = Route()

router.use("/auth",authRoute)
router.use("/user",userRoute)

export default router