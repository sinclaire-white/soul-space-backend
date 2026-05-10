import { Request, Response } from "express";
import status from "http-status";

import { AdminService } from "./admin.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getDashboardStats();
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Dashboard stats retrieved successfully",
        data: result,
    });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getUserStats();
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User stats retrieved successfully",
        data: result,
    });
});

const getPostStats = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getPostStats();
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Post stats retrieved successfully",
        data: result,
    });
});

const getBookingStats = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getBookingStats();
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Booking stats retrieved successfully",
        data: result,
    });
});

const getReportStats = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getReportStats();
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Report stats retrieved successfully",
        data: result,
    });
});

const getDailyStats = catchAsync(async (req: Request, res: Response) => {
    const days = req.query.days ? Number(req.query.days) : 30;
    const result = await AdminService.getDailyStats(days);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Daily stats retrieved successfully",
        data: result,
    });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getAllUsers(req.query);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Users retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await AdminService.getUserById(id);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await AdminService.updateUser(id, req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User updated successfully",
        data: result,
    });
});

const moderateUser = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await AdminService.moderateUser(id, req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User moderated successfully",
        data: result,
    });
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { role } = req.body as { role: "USER" | "ADMIN" };
    const requesterId = (req as any).user.userId as string;
    const result = await AdminService.changeUserRole(id, role, requesterId);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: role === "ADMIN" ? "User promoted to admin." : "Admin role removed.",
        data: result,
    });
});

const getAllConsultants = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getAllConsultants(req.query);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Consultants retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getAllPosts(req.query);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Posts retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await AdminService.updatePost(id, req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Post updated successfully",
        data: result,
    });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await AdminService.deletePost(id);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const getModerationLogs = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getModerationLogs(req.query);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Moderation logs retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

export const AdminController = {
    getDashboardStats,
    getUserStats,
    getPostStats,
    getBookingStats,
    getReportStats,
    getDailyStats,
    getAllUsers,
    getUserById,
    updateUser,
    moderateUser,
    changeUserRole,
    getAllConsultants,
    getAllPosts,
    updatePost,
    deletePost,
    getModerationLogs,
};
