import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ReviewController } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = express.Router();

// Public routes
router.get("/consultant/:consultantId", ReviewController.getReviewsByConsultant);
router.get("/consultant/:consultantId/stats", ReviewController.getReviewStats);
router.get("/:id", ReviewController.getReviewById);

// Protected routes - Client
router.post(
    "/",
    checkAuth(UserRole.USER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(ReviewValidation.createReviewSchema),
    ReviewController.createReview
);

router.get("/me/reviews", checkAuth(), ReviewController.getMyReviews);

router.patch(
    "/:id",
    checkAuth(),
    validateRequest(ReviewValidation.updateReviewSchema),
    ReviewController.updateReview
);

// Protected routes - Consultant
router.patch("/:id/hide", checkAuth(UserRole.CONSULTANT), ReviewController.hideReview);

export const ReviewRoutes = router;
