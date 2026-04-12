import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { reportLimiter } from "../../middleware/rateLimiter";
import { ReportController } from "./report.controller";
import { ReportValidation } from "./report.validation";

const router = express.Router();

// Protected routes - All authenticated users with rate limiting
router.post(
    "/",
    checkAuth(),
    reportLimiter,
    validateRequest(ReportValidation.createReportSchema),
    ReportController.createReport
);

router.get("/me", checkAuth(), ReportController.getMyReports);

// Admin routes
router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    ReportController.getAllReports
);

router.get("/stats", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ReportController.getReportStats);
router.get("/:id", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ReportController.getReportById);

router.patch(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(ReportValidation.updateReportSchema),
    ReportController.updateReport
);

router.patch("/:id/hide", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ReportController.hideContent);
router.patch("/:id/remove", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ReportController.removeContent);

export const ReportRoutes = router;
