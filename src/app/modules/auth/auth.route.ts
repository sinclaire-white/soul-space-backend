import express from "express";
import { loginLimiter } from "../../middleware/rateLimiter";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

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

export const AuthRoutes = router;