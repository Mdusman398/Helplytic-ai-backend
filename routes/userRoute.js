import express from "express"
import  {signUp, verification, login, logOut, forgotPassword, verifyOtp, changePassword, getMe}  from "../controller/userController.js"
import { isAuthenticated } from "../middleWare/authMiddleware.js"
import { userSchema, validateUser } from "../validations/authValidation.js"
const router = express.Router()
router.post("/signup",validateUser(userSchema), signUp)

router.get("/verify/:token", verification)
router.post("/login", login)
router.post("/logout", isAuthenticated, logOut)
router.post("/forgot-password", forgotPassword)
router.post("/verify-otp/:email",verifyOtp )
router.post("/change-password/:email", changePassword)

router.get("/me", isAuthenticated, getMe)

export default router
