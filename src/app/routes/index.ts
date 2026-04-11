import { Router } from "express";
import { CommentRoutes } from "../modules/comment/comment.route";
import { NicknameRoutes } from "../modules/nickname/nickname.route";
import { PostRoutes } from "../modules/post/post.route";
import { ReactionRoutes } from "../modules/reaction/reaction.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

router.use("/users", UserRoutes);
router.use("/nicknames", NicknameRoutes);
router.use("/posts", PostRoutes);
router.use("/comments", CommentRoutes);
router.use("/reactions", ReactionRoutes);

export const IndexRoutes = router;
