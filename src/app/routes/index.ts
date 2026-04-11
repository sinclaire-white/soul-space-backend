import { Router } from "express";
import { NicknameRoutes } from "../modules/nickname/nickname.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

router.use("/users", UserRoutes);
router.use("/nicknames", NicknameRoutes);

export const IndexRoutes = router;
