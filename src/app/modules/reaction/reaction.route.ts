import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ReactionController } from "./reaction.controller";
import { ReactionValidation } from "./reaction.validation";

const router = Router();

// Public routes
router.get("/trending", ReactionController.getTrendingPosts);
router.get("/post/:postId", ReactionController.getPostReactions);

// Protected routes
router.post(
    "/post/:postId",
    checkAuth(),
    validateRequest(ReactionValidation.createReactionSchema),
    ReactionController.createOrUpdateReaction
);

router.delete("/post/:postId", checkAuth(), ReactionController.removeReaction);

router.get("/me/reactions", checkAuth(), ReactionController.getMyReactions);

export const ReactionRoutes = router;
