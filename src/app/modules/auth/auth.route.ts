import { Router } from "express";
import { loginLimiter } from "../../middleware/rateLimiter";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

// Public routes
router.post(
    "/register",
    validateRequest(AuthValidation.registerSchema),
    AuthController.registerUser
);

router.post(
    "/login",
    loginLimiter,
    validateRequest(AuthValidation.loginSchema),
    AuthController.loginUser
);

router.post(
    "/refresh-token",
    validateRequest(AuthValidation.refreshTokenSchema),
    AuthController.getNewToken
);

router.post(
    "/verify-email",
    validateRequest(AuthValidation.verifyEmailSchema),
    AuthController.verifyEmail
);

router.post(
    "/forgot-password",
    validateRequest(AuthValidation.forgotPasswordSchema),
    AuthController.forgetPassword
);

router.post(
    "/reset-password",
    validateRequest(AuthValidation.resetPasswordSchema),
    AuthController.resetPassword
);

// Protected routes
router.get("/me", checkAuth(), AuthController.getMe);

router.post(
    "/change-password",
    checkAuth(),
    validateRequest(AuthValidation.changePasswordSchema),
    AuthController.changePassword
);

router.post(
    "/logout",
    checkAuth(),
    validateRequest(AuthValidation.logoutSchema),
    AuthController.logoutUser
);

// Google OAuth callback
router.get("/google/callback", AuthController.googleLoginSuccess);

export const AuthRoutes = router;
