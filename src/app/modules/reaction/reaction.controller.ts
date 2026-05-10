import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ReactionService } from "./reaction.service";

const createOrUpdateReaction = catchAsync(async (req: Request, res: Response) => {
    const postId = req.params.postId as string;
    const userId = (req as any).user?.userId;
    const result = await ReactionService.createOrUpdateReaction(postId, userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Reaction added successfully",
        data: result,
    });
});

const removeReaction = catchAsync(async (req: Request, res: Response) => {
    const postId = req.params.postId as string;
    const userId = (req as any).user?.userId;
    await ReactionService.removeReaction(postId, userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Reaction removed successfully",
        data: null,
    });
});

const getPostReactions = catchAsync(async (req: Request, res: Response) => {
    const postId = req.params.postId as string;
    const userId = (req as any).user?.userId;
    const result = await ReactionService.getPostReactions(postId, userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Post reactions retrieved successfully",
        data: result,
    });
});

const getMyReactions = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await ReactionService.getUserReactions(userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "My reactions retrieved successfully",
        data: result,
    });
});

const getTrendingPosts = catchAsync(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await ReactionService.getTrendingPosts(limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Trending posts retrieved successfully",
        data: result,
    });
});

export const ReactionController = {
    createOrUpdateReaction,
    removeReaction,
    getPostReactions,
    getMyReactions,
    getTrendingPosts,
};
