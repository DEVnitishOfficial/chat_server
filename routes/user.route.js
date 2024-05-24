import { Router } from "express";
import { getUser, updateMe } from "../controllers/user.controller.js";
import { protect } from "../controllers/auth.controller.js";
const router = Router()

router.patch("update-me",protect, updateMe)
router.post("get-users", protect, getUser )

export default router