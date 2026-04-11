import { Request, Response } from "express";
import status from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ConsultantService } from "./consultant.service";
import { IConsultantFilters } from "./consultant.interface";

const createConsultant = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await ConsultantService.createConsultant(userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Consultant profile created successfully",
        data: result,
    });
});

const getAllConsultants = catchAsync(async (req: Request, res: Response) => {
    const filters: IConsultantFilters = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await ConsultantService.getAllConsultants(filters, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Consultants retrieved successfully",
        data: result.consultants,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getConsultantById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ConsultantService.getConsultantById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Consultant retrieved successfully",
        data: result,
    });
});

const getMyConsultantProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await ConsultantService.getConsultantByUserId(userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Consultant profile retrieved successfully",
        data: result,
    });
});

const updateMyConsultantProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await ConsultantService.updateConsultant(userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Consultant profile updated successfully",
        data: result,
    });
});

const updateVerificationStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { verificationStatus } = req.body;
    const result = await ConsultantService.updateVerificationStatus(id, verificationStatus);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Verification status updated successfully",
        data: result,
    });
});

const getPendingVerifications = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await ConsultantService.getPendingVerifications(page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Pending verifications retrieved successfully",
        data: result.consultants,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getSpecializations = catchAsync(async (req: Request, res: Response) => {
    const result = await ConsultantService.getSpecializations();

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Specializations retrieved successfully",
        data: result,
    });
});

export const ConsultantController = {
    createConsultant,
    getAllConsultants,
    getConsultantById,
    getMyConsultantProfile,
    updateMyConsultantProfile,
    updateVerificationStatus,
    getPendingVerifications,
    getSpecializations,
};
