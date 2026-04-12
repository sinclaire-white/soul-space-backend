import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityValidation } from "./availability.validation";

const router = express.Router();

// Public routes
router.get("/slots/:consultantId", AvailabilityController.getAvailableSlots);

// Protected routes - Consultant only
router.post(
    "/",
    checkAuth(UserRole.CONSULTANT),
    validateRequest(AvailabilityValidation.createAvailabilitySchema),
    AvailabilityController.createAvailability
);

router.get("/me", checkAuth(UserRole.CONSULTANT), AvailabilityController.getMyAvailabilities);

router.patch(
    "/:id",
    checkAuth(UserRole.CONSULTANT),
    validateRequest(AvailabilityValidation.updateAvailabilitySchema),
    AvailabilityController.updateAvailability
);

router.delete("/:id", checkAuth(UserRole.CONSULTANT), AvailabilityController.deleteAvailability);

router.post(
    "/block",
    checkAuth(UserRole.CONSULTANT),
    AvailabilityController.blockTimeSlot
);

export const AvailabilityRoutes = router;
