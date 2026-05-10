import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { uploadPdf } from "../../middleware/upload";
import { validateRequest } from "../../middleware/validateRequest";
import { ConsultantApplicationController } from "./consultantApplication.controller";
import { ConsultantApplicationValidation } from "./consultantApplication.validation";

const router = express.Router();

router.post(
    "/application-payment",
    checkAuth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    ConsultantApplicationController.createApplicationPayment
);

router.post(
    "/",
    checkAuth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    uploadPdf.single("certificationDocument"),
    validateRequest(ConsultantApplicationValidation.createApplicationSchema),
    ConsultantApplicationController.submitApplication
);

router.get(
    "/me",
    checkAuth(UserRole.USER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    ConsultantApplicationController.getMyApplication
);

router.get(
    "/admin",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    ConsultantApplicationController.getApplicationsForAdmin
);

router.patch(
    "/admin/:id/review",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(ConsultantApplicationValidation.reviewApplicationSchema),
    ConsultantApplicationController.reviewApplication
);

export const ConsultantApplicationRoutes = router;
