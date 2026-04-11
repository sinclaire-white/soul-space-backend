import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

router.use("/users", UserRoutes);

export const IndexRoutes = router;
