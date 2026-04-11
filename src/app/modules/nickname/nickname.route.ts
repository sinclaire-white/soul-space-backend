import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { NicknameController } from "./nickname.controller";
import { NicknameValidation } from "./nickname.validation";

const router = Router();

// Public routes
router.get("/check/:handle", NicknameController.checkHandleAvailability);
router.get("/profile/:handle", NicknameController.getNicknameByHandle);

// Protected routes
router.post(
    "/",
    checkAuth(),
    validateRequest(NicknameValidation.createNicknameSchema),
    NicknameController.createNickname
);

router.get("/me", checkAuth(), NicknameController.getMyNickname);

router.patch(
    "/me",
    checkAuth(),
    validateRequest(NicknameValidation.updateNicknameSchema),
    NicknameController.updateMyNickname
);

router.post(
    "/me/rotate",
    checkAuth(),
    validateRequest(NicknameValidation.rotateNicknameSchema),
    NicknameController.rotateMyNickname
);

export const NicknameRoutes = router;
