import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CommentController } from "./comment.controller";
import { CommentValidation } from "./comment.validation";

const router = Router();

// Public routes
router.get("/post/:postId", CommentController.getCommentsByPostId);
router.get("/:id", CommentController.getCommentById);

// Protected routes
router.post(
    "/post/:postId",
    checkAuth(),
    validateRequest(CommentValidation.createCommentSchema),
    CommentController.createComment
);

router.patch(
    "/:id",
    checkAuth(),
    validateRequest(CommentValidation.updateCommentSchema),
    CommentController.updateComment
);

router.delete("/:id", checkAuth(), CommentController.deleteComment);

export const CommentRoutes = router;
