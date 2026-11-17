import { Router } from "express";
import { body } from "express-validator";
import { forgotPassword, googleLogin, login, logout, me, register, resetPassword, verifyEmail } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";

const router = Router();
router.post("/register", body("name").trim().isLength({ min: 2, max: 80 }), body("email").isEmail().normalizeEmail(), body("password").isLength({ min: 10, max: 128 }), body("role").optional().isIn(["customer", "owner"]), validate, register);
router.post("/login", body("email").isEmail().normalizeEmail(), body("password").isString().notEmpty(), validate, login);
router.post("/google", body("credential").isString().notEmpty(), validate, googleLogin);
router.post("/logout", logout);
router.get("/me", protect, me);
router.post("/verify-email", body("token").isString().notEmpty(), validate, verifyEmail);
router.post("/forgot-password", body("email").isEmail().normalizeEmail(), validate, forgotPassword);
router.post("/reset-password", body("token").isString().notEmpty(), body("password").isLength({ min: 10, max: 128 }), validate, resetPassword);
export default router;
