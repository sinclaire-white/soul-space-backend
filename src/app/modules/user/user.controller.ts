import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { UserService } from "./user.service";
import { IUserFilters } from "./user.interface";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const filters: IUserFilters = req.query;
    const result = await UserService.getAllUsers(filters);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Users retrieved successfully",
        data: result,
    });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserService.getUserById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await UserService.getUserById(userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Profile retrieved successfully",
        data: result,
    });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await UserService.updateUser(userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    const result = await UserService.updateUserRole(id, role);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User role updated successfully",
        data: result,
    });
});

const deactivateUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserService.deactivateUser(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User deactivated successfully",
        data: result,
    });
});

const activateUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserService.activateUser(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User activated successfully",
        data: result,
    });
});

export const UserController = {
    getAllUsers,
    getUserById,
    getMyProfile,
    updateMyProfile,
    updateUserRole,
    deactivateUser,
    activateUser,
};
