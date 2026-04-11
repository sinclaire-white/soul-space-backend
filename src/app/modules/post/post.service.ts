import { PostStatus, PostVisibility } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IPost, IPostCreate, IPostFilters, IPostUpdate, IPostWithAuthor } from "./post.interface";

const createPost = async (
    userId: string,
    nicknameId: string | null,
    payload: IPostCreate
): Promise<IPost> => {
    const post = await prisma.post.create({
        data: {
            ...payload,
            authorId: userId,
            nicknameId,
        },
    });

    return post as IPost;
};

const getAllPosts = async (
    filters: IPostFilters,
    page: number = 1,
    limit: number = 10
): Promise<{ posts: IPostWithAuthor[]; total: number }> => {
    const where: any = {
        status: PostStatus.ACTIVE,
        deletedAt: null,
    };

    if (filters.visibleTo) {
        where.visibleTo = filters.visibleTo;
    }

    if (filters.authorId) {
        where.authorId = filters.authorId;
    }

    if (filters.isAnonymous !== undefined) {
        where.isAnonymous = filters.isAnonymous;
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: {
                        id: true,
                        nickname: {
                            select: {
                                handle: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        reactions: true,
                    },
                },
            },
        }),
        prisma.post.count({ where }),
    ]);

    return { posts: posts as IPostWithAuthor[], total };
};

const getPostById = async (id: string): Promise<IPostWithAuthor | null> => {
    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    nickname: {
                        select: {
                            handle: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    comments: true,
                    reactions: true,
                },
            },
        },
    });

    if (!post) {
        return null;
    }

    // Increment view count
    await prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
    });

    return post as IPostWithAuthor;
};

const getMyPosts = async (
    userId: string,
    page: number = 1,
    limit: number = 10
): Promise<{ posts: IPost[]; total: number }> => {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where: {
                authorId: userId,
                deletedAt: null,
            },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.post.count({
            where: {
                authorId: userId,
                deletedAt: null,
            },
        }),
    ]);

    return { posts: posts as IPost[], total };
};

const updatePost = async (
    id: string,
    userId: string,
    payload: IPostUpdate
): Promise<IPost | null> => {
    const existingPost = await prisma.post.findFirst({
        where: { id, authorId: userId },
    });

    if (!existingPost) {
        throw new AppError(status.NOT_FOUND, "Post not found or you don't have permission");
    }

    const post = await prisma.post.update({
        where: { id },
        data: payload,
    });

    return post as IPost;
};

const hidePost = async (id: string, userId: string): Promise<IPost | null> => {
    const existingPost = await prisma.post.findFirst({
        where: { id, authorId: userId },
    });

    if (!existingPost) {
        throw new AppError(status.NOT_FOUND, "Post not found or you don't have permission");
    }

    const post = await prisma.post.update({
        where: { id },
        data: { status: PostStatus.HIDDEN_BY_USER },
    });

    return post as IPost;
};

const deletePost = async (id: string, userId: string): Promise<IPost | null> => {
    const existingPost = await prisma.post.findFirst({
        where: { id, authorId: userId },
    });

    if (!existingPost) {
        throw new AppError(status.NOT_FOUND, "Post not found or you don't have permission");
    }

    const post = await prisma.post.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    return post as IPost;
};

export const PostService = {
    createPost,
    getAllPosts,
    getPostById,
    getMyPosts,
    updatePost,
    hidePost,
    deletePost,
};
