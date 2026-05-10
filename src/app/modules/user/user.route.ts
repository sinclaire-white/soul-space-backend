import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { upload } from "../../middleware/upload";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

// Public routes
router.get("/profile/:id", UserController.getPublicProfile);

// Admin only routes
router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    UserController.getAllUsers
);

router.get(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    UserController.getUserById
);

router.patch(
    "/:id/role",
    checkAuth(UserRole.SUPER_ADMIN),
    validateRequest(UserValidation.updateUserRoleSchema),
    UserController.updateUserRole
);

router.patch(
    "/:id/deactivate",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    UserController.deactivateUser
);

router.patch(
    "/:id/activate",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    UserController.activateUser
);

// Protected routes (authenticated users)
router.get(
    "/me/profile",
    checkAuth(UserRole.USER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    UserController.getMyProfile
);

router.patch(
    "/me/profile",
    checkAuth(UserRole.USER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    upload.single("image"),
    validateRequest(UserValidation.updateUserSchema),
    UserController.updateMyProfile
);

export const UserRoutes = router;
