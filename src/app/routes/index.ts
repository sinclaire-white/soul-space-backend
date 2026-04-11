import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { AvailabilityRoutes } from "../modules/availability/availability.route";
import { BookingRoutes } from "../modules/booking/booking.route";
import { CommentRoutes } from "../modules/comment/comment.route";
import { ConsultantRoutes } from "../modules/consultant/consultant.route";
import { NicknameRoutes } from "../modules/nickname/nickname.route";
import { PostRoutes } from "../modules/post/post.route";
import { ReactionRoutes } from "../modules/reaction/reaction.route";
import { ReportRoutes } from "../modules/report/report.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/nicknames", NicknameRoutes);
router.use("/posts", PostRoutes);
router.use("/comments", CommentRoutes);
router.use("/reactions", ReactionRoutes);
router.use("/consultants", ConsultantRoutes);
router.use("/availabilities", AvailabilityRoutes);
router.use("/bookings", BookingRoutes);
router.use("/reviews", ReviewRoutes);
router.use("/reports", ReportRoutes);

export const IndexRoutes = router;
