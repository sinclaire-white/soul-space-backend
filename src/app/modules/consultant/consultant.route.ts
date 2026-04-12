import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ConsultantController } from "./consultant.controller";
import { ConsultantValidation } from "./consultant.validation";

const router = express.Router();

// Public routes
router.get("/", ConsultantController.getAllConsultants);
router.get("/specializations", ConsultantController.getSpecializations);
router.get("/:id", ConsultantController.getConsultantById);

// Protected routes - Consultant only
router.post(
    "/",
    checkAuth(UserRole.USER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(ConsultantValidation.createConsultantSchema),
    ConsultantController.createConsultant
);

router.get("/me/profile", checkAuth(UserRole.CONSULTANT), ConsultantController.getMyConsultantProfile);

router.patch(
    "/me/profile",
    checkAuth(UserRole.CONSULTANT),
    validateRequest(ConsultantValidation.updateConsultantSchema),
    ConsultantController.updateMyConsultantProfile
);

// Admin routes
router.get(
    "/admin/pending",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    ConsultantController.getPendingVerifications
);

router.patch(
    "/:id/verification",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(ConsultantValidation.updateVerificationSchema),
    ConsultantController.updateVerificationStatus
);

export const ConsultantRoutes = router;
