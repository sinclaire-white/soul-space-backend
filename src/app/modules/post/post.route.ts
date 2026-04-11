import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PostController } from "./post.controller";
import { PostValidation } from "./post.validation";

const router = Router();

// Public routes
router.get("/", PostController.getAllPosts);
router.get("/:id", PostController.getPostById);

// Protected routes
router.post(
    "/",
    checkAuth(),
    validateRequest(PostValidation.createPostSchema),
    PostController.createPost
);

router.get("/me/posts", checkAuth(), PostController.getMyPosts);

router.patch(
    "/:id",
    checkAuth(),
    validateRequest(PostValidation.updatePostSchema),
    PostController.updatePost
);

router.patch("/:id/hide", checkAuth(), PostController.hidePost);

router.delete("/:id", checkAuth(), PostController.deletePost);

export const PostRoutes = router;
