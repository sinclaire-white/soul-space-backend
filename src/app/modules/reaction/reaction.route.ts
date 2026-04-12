import express from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { reactionLimiter } from "../../middleware/rateLimiter";
import { ReactionController } from "./reaction.controller";
import { ReactionValidation } from "./reaction.validation";

const router = express.Router();

// Public routes
router.get("/trending", ReactionController.getTrendingPosts);
router.get("/post/:postId", ReactionController.getPostReactions);

// Protected routes with rate limiting
router.post(
    "/post/:postId",
    checkAuth(),
    reactionLimiter,
    validateRequest(ReactionValidation.createReactionSchema),
    ReactionController.createOrUpdateReaction
);

router.delete("/post/:postId", checkAuth(), ReactionController.removeReaction);

router.get("/me/reactions", checkAuth(), ReactionController.getMyReactions);

export const ReactionRoutes = router;
