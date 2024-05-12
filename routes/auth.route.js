import { Router } from "express";
import { forgotPassword, login,register, resetPassword, sendOTP, verifyUserByOtp } from "../controllers/auth.controller.js";

const router = Router()

router.post("/login",login)
router.post("/register",register,sendOTP)
router.post("/send-otp",sendOTP)
router.post("/verify-user",verifyUserByOtp)
router.post("/forgot-password",forgotPassword)
router.post("/reset-password",resetPassword)

export default router