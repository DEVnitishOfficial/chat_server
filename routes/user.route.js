import { Router } from "express";
import { getFriends, getRequest, getUser, updateMe } from "../controllers/user.controller.js";
import { protect } from "../controllers/auth.controller.js";
const router = Router()

router.patch("update-me",protect, updateMe)

router.get("get-users", protect, getUser )
router.get("get-friends", protect, getFriends )
router.get("get-friends-request", protect, getRequest )
export default router