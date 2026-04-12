import express from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { postLimiter } from "../../middleware/rateLimiter";
import { PostController } from "./post.controller";
import { PostValidation } from "./post.validation";

const router = express.Router();

// Public routes
router.get("/", PostController.getAllPosts);
router.get("/:id", PostController.getPostById);

// Protected routes with rate limiting
router.post(
    "/",
    checkAuth(),
    postLimiter,
    validateRequest(PostValidation.createPostSchema),
    PostController.createPost
);

router.get("/my-posts", checkAuth(), PostController.getMyPosts);

router.patch(
    "/:id",
    checkAuth(),
    validateRequest(PostValidation.updatePostSchema),
    PostController.updatePost
);

router.patch("/:id/hide", checkAuth(), PostController.hidePost);

router.delete("/:id", checkAuth(), PostController.deletePost);

export const PostRoutes = router;
