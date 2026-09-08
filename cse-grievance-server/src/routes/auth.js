import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { authenticate, loadUser } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.get("/captcha", authController.issueCaptcha);
router.get("/captcha-status", authController.captchaStatus);
router.post("/refresh", validate(refreshTokenSchema), authController.refresh);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get("/me", authenticate, loadUser, authController.me);

export default router;
