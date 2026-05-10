import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { UserService } from "./user.service";
import { IUserFilters } from "./user.interface";
import { UserRole } from "../../../../prisma/generated/prisma/enums";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const filters: IUserFilters = {
        role: req.query.role as UserRole | undefined,
        isActive: req.query.isActive ? (req.query.isActive === 'true') : undefined,
        search: req.query.search as string | undefined,
    };
    const result = await UserService.getAllUsers(filters);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Users retrieved successfully",
        data: result,
    });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
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
    if (!userId) {
        throw new Error("User not authenticated");
    }
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
    if (!userId) {
        throw new Error("User not authenticated");
    }

    // Parse body fields from multipart form data if sent as JSON string
    let body = req.body;
    if (typeof body.data === "string") {
        body = JSON.parse(body.data);
    }

    const result = await UserService.updateUser(userId, body, req.file);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const role = req.body.role as UserRole;
    const result = await UserService.updateUserRole(id, role);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User role updated successfully",
        data: result,
    });
});

const deactivateUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await UserService.deactivateUser(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User deactivated successfully",
        data: result,
    });
});

const activateUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await UserService.activateUser(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User activated successfully",
        data: result,
    });
});

const getPublicProfile = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await UserService.getPublicProfile(id);

    if (!result) {
        sendResponse(res, { httpStatusCode: status.NOT_FOUND, success: false, message: "User not found", data: null });
        return;
    }

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Public profile retrieved successfully",
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
    getPublicProfile,
};
