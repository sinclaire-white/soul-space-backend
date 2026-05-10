import { Request, Response } from "express";
import status from "http-status";
import { ApplicationStatus } from "../../../../prisma/generated/prisma/enums";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ConsultantApplicationService } from "./consultantApplication.service";

const createApplicationPayment = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;
    const result = await ConsultantApplicationService.createApplicationPayment(userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Application payment intent created successfully",
        data: result,
    });
});

const submitApplication = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;
    const result = await ConsultantApplicationService.submitApplication(userId, req.body, req.file);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Consultant application submitted successfully",
        data: result,
    });
});

const getMyApplication = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId as string;
    const result = await ConsultantApplicationService.getMyApplication(userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Consultant application retrieved successfully",
        data: result,
    });
});

const getApplicationsForAdmin = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const statusFilter = req.query.status as ApplicationStatus | undefined;

    const result = await ConsultantApplicationService.getApplicationsForAdmin({
        page,
        limit,
        status: statusFilter,
    });

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Consultant applications retrieved successfully",
        data: result.applications,
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    });
});

const reviewApplication = catchAsync(async (req: Request, res: Response) => {
    const applicationId = req.params.id as string;
    const reviewerId = req.user?.userId as string;

    const result = await ConsultantApplicationService.reviewApplication(
        applicationId,
        reviewerId,
        req.body
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: `Consultant application ${req.body.status.toLowerCase()} successfully`,
        data: result,
    });
});

export const ConsultantApplicationController = {
    createApplicationPayment,
    submitApplication,
    getMyApplication,
    getApplicationsForAdmin,
    reviewApplication,
};
