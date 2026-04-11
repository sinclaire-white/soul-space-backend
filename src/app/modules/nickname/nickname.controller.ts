import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { NicknameService } from "./nickname.service";

const createNickname = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await NicknameService.createNickname({
        userId,
        ...req.body,
    });

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Nickname created successfully",
        data: result,
    });
});

const getMyNickname = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await NicknameService.getNicknameByUserId(userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Nickname retrieved successfully",
        data: result,
    });
});

const getNicknameByHandle = catchAsync(async (req: Request, res: Response) => {
    const { handle } = req.params;
    const result = await NicknameService.getNicknameByHandle(handle);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Nickname retrieved successfully",
        data: result,
    });
});

const updateMyNickname = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await NicknameService.updateNickname(userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Nickname updated successfully",
        data: result,
    });
});

const rotateMyNickname = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const { newHandle } = req.body;
    const result = await NicknameService.rotateNickname(userId, newHandle);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Nickname rotated successfully",
        data: result,
    });
});

const checkHandleAvailability = catchAsync(async (req: Request, res: Response) => {
    const { handle } = req.params;
    const isAvailable = await NicknameService.checkHandleAvailability(handle);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Handle availability checked",
        data: { handle, isAvailable },
    });
});

export const NicknameController = {
    createNickname,
    getMyNickname,
    getNicknameByHandle,
    updateMyNickname,
    rotateMyNickname,
    checkHandleAvailability,
};
