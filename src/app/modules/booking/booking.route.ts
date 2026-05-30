import express from "express";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { bookingLimiter } from "../../middleware/rateLimiter";
import { BookingController } from "./booking.controller";
import { BookingValidation } from "./booking.validation";

const router = express.Router();

// Client routes with rate limiting
router.post(
    "/",
    checkAuth(UserRole.USER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    bookingLimiter,
    validateRequest(BookingValidation.createBookingSchema),
    BookingController.createBooking
);

router.get(
    "/consultant/bookings",
    checkAuth(UserRole.CONSULTANT),
    BookingController.getConsultantBookings
);

router.get("/me", checkAuth(), BookingController.getMyBookings);
router.get("/:id", checkAuth(), BookingController.getBookingById);
router.patch(
    "/:id",
    checkAuth(),
    validateRequest(BookingValidation.updateBookingSchema),
    BookingController.updateBooking
);
router.patch("/:id/cancel", checkAuth(), BookingController.cancelBooking);

router.patch("/:id/confirm", checkAuth(UserRole.CONSULTANT), BookingController.confirmBooking);

router.patch(
    "/:id/complete",
    checkAuth(UserRole.CONSULTANT),
    BookingController.completeBooking
);
router.patch("/:id/decline", checkAuth(UserRole.CONSULTANT), BookingController.declineBooking);

export const BookingRoutes = router;
