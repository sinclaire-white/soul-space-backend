import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = express.Router();

// All routes require admin or super admin
router.use(checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN));

// Dashboard stats
router.get("/dashboard/stats", AdminController.getDashboardStats);
router.get("/stats/users", AdminController.getUserStats);
router.get("/stats/posts", AdminController.getPostStats);
router.get("/stats/bookings", AdminController.getBookingStats);
router.get("/stats/reports", AdminController.getReportStats);
router.get("/stats/daily", AdminController.getDailyStats);

// User management
router.get("/users", AdminController.getAllUsers);
router.get("/users/:id", AdminController.getUserById);
router.patch(
    "/users/:id",
    validateRequest(AdminValidation.updateUserSchema),
    AdminController.updateUser
);
router.post(
    "/users/:id/moderate",
    validateRequest(AdminValidation.moderationSchema),
    AdminController.moderateUser
);
// Super-admin only: promote/demote admin role
router.patch(
    "/users/:id/role",
    checkAuth(UserRole.SUPER_ADMIN),
    AdminController.changeUserRole
);

// Post management
router.get("/posts", AdminController.getAllPosts);
router.patch(
    "/posts/:id",
    validateRequest(AdminValidation.updatePostSchema),
    AdminController.updatePost
);
router.delete("/posts/:id", AdminController.deletePost);

// Consultant management
router.get("/consultants", AdminController.getAllConsultants);

// Moderation logs
router.get("/moderation-logs", AdminController.getModerationLogs);

export const AdminRoutes = router;
