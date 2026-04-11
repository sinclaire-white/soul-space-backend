import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ReviewService } from "./review.service";
import { IReviewFilters } from "./review.interface";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const clientId = (req as any).user?.userId;
    const result = await ReviewService.createReview(clientId, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Review created successfully",
        data: result,
    });
});

const getReviewsByConsultant = catchAsync(async (req: Request, res: Response) => {
    const { consultantId } = req.params;
    const filters: IReviewFilters = { ...req.query, consultantId };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await ReviewService.getReviewsByConsultant(consultantId, filters, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Reviews retrieved successfully",
        data: result.reviews,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
    const clientId = (req as any).user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await ReviewService.getMyReviews(clientId, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "My reviews retrieved successfully",
        data: result.reviews,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ReviewService.getReviewById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Review retrieved successfully",
        data: result,
    });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const clientId = (req as any).user?.userId;
    const result = await ReviewService.updateReview(id, clientId, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Review updated successfully",
        data: result,
    });
});

const hideReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const consultantId = (req as any).user?.userId;
    const result = await ReviewService.hideReview(id, consultantId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Review hidden successfully",
        data: result,
    });
});

const getReviewStats = catchAsync(async (req: Request, res: Response) => {
    const { consultantId } = req.params;
    const result = await ReviewService.getReviewStats(consultantId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Review stats retrieved successfully",
        data: result,
    });
});

export const ReviewController = {
    createReview,
    getReviewsByConsultant,
    getMyReviews,
    getReviewById,
    updateReview,
    hideReview,
    getReviewStats,
};
