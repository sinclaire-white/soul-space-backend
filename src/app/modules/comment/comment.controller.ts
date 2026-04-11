import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CommentService } from "./comment.service";

const createComment = catchAsync(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const result = await CommentService.createComment(postId, userId, userRole, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Comment created successfully",
        data: result,
    });
});

const getCommentsByPostId = catchAsync(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await CommentService.getCommentsByPostId(postId, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Comments retrieved successfully",
        data: result.comments,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getCommentById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CommentService.getCommentById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Comment retrieved successfully",
        data: result,
    });
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const result = await CommentService.updateComment(id, userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Comment updated successfully",
        data: result,
    });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const result = await CommentService.deleteComment(id, userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Comment deleted successfully",
        data: result,
    });
});

export const CommentController = {
    createComment,
    getCommentsByPostId,
    getCommentById,
    updateComment,
    deleteComment,
};
