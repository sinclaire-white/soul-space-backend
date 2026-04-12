import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PostService } from "./post.service";
import { IPostFilters } from "./post.interface";
import { PostStatus, PostVisibility } from "../../../../prisma/generated/prisma/enums";

const createPost = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const nicknameId = (req as any).user?.nicknameId || null;
    const result = await PostService.createPost(userId, nicknameId, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Post created successfully",
        data: result,
    });
});

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
    const filters: IPostFilters = {
        status: req.query.status as PostStatus | undefined,
        visibleTo: req.query.visibleTo as PostVisibility | undefined,
        authorId: req.query.authorId as string | undefined,
        isAnonymous: req.query.isAnonymous ? (req.query.isAnonymous === 'true') : undefined,
    };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await PostService.getAllPosts(filters, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Posts retrieved successfully",
        data: result.posts,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getPostById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PostService.getPostById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Post retrieved successfully",
        data: result,
    });
});

const getMyPosts = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await PostService.getMyPosts(userId, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "My posts retrieved successfully",
        data: result.posts,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user?.userId;
    const result = await PostService.updatePost(id, userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Post updated successfully",
        data: result,
    });
});

const hidePost = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user?.userId;
    const result = await PostService.hidePost(id, userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Post hidden successfully",
        data: result,
    });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user?.userId;
    const result = await PostService.deletePost(id, userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Post deleted successfully",
        data: result,
    });
});

export const PostController = {
    createPost,
    getAllPosts,
    getPostById,
    getMyPosts,
    updatePost,
    hidePost,
    deletePost,
};
