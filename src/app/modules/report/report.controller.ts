import { Request, Response } from "express";
import status from "http-status";
import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ReportService } from "./report.service";
import { IReportFilters } from "./report.interface";

const createReport = catchAsync(async (req: Request, res: Response) => {
    const reporterId = (req as any).user?.userId;
    const result = await ReportService.createReport(reporterId, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Report submitted successfully",
        data: result,
    });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
    const filters: IReportFilters = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await ReportService.getAllReports(filters, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Reports retrieved successfully",
        data: result.reports,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getReportById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ReportService.getReportById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Report retrieved successfully",
        data: result,
    });
});

const updateReport = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ReportService.updateReport(id, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Report updated successfully",
        data: result,
    });
});

const hideContent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ReportService.hideContent(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Content hidden successfully",
        data: null,
    });
});

const removeContent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ReportService.removeContent(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Content removed successfully",
        data: null,
    });
});

const getMyReports = catchAsync(async (req: Request, res: Response) => {
    const reporterId = (req as any).user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await ReportService.getMyReports(reporterId, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "My reports retrieved successfully",
        data: result.reports,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getReportStats = catchAsync(async (req: Request, res: Response) => {
    const result = await ReportService.getReportStats();

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Report stats retrieved successfully",
        data: result,
    });
});

export const ReportController = {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    hideContent,
    removeContent,
    getMyReports,
    getReportStats,
};
