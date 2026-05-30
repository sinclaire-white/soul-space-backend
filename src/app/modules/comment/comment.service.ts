import { CommentStatus, UserRole } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IComment, ICommentCreate, ICommentUpdate, ICommentWithAuthor } from "./comment.interface";

const MAX_NESTING_LEVEL = 3;

const createComment = async (
    postId: string,
    userId: string,
    userRole: UserRole,
    payload: ICommentCreate
): Promise<IComment> => {
    // Check if post exists and is active
    const post = await prisma.post.findFirst({
        where: { id: postId, status: { not: "REMOVED" }, deletedAt: null },
    });

    if (!post) {
        throw new AppError(status.NOT_FOUND, "Post not found");
    }

    let parentCommentId = payload.parentCommentId;
    let nestingLevel = 0;

    // If replying to a comment, check nesting level
    if (parentCommentId) {
        const parentComment = await prisma.comment.findUnique({
            where: { id: parentCommentId },
        });

        if (!parentComment) {
            throw new AppError(status.NOT_FOUND, "Parent comment not found");
        }

        // Calculate nesting level
        let currentParentId = parentComment.parentCommentId;
        nestingLevel = 1;

        while (currentParentId && nestingLevel < MAX_NESTING_LEVEL) {
            const parent = await prisma.comment.findUnique({
                where: { id: currentParentId },
            });
            if (parent) {
                nestingLevel++;
                currentParentId = parent.parentCommentId;
            } else {
                break;
            }
        }

        if (nestingLevel >= MAX_NESTING_LEVEL) {
            throw new AppError(
                status.BAD_REQUEST,
                "Maximum nesting level reached (3 levels)"
            );
        }
    }

    const isConsultantReply = userRole === UserRole.CONSULTANT;

    const comment = await prisma.comment.create({
        data: {
            content: payload.content,
            postId,
            authorId: userId,
            parentCommentId: parentCommentId || null,
            isConsultantReply,
        },
    });

    return comment as IComment;
};

const getCommentsByPostId = async (
    postId: string,
    page: number = 1,
    limit: number = 20
): Promise<{ comments: ICommentWithAuthor[]; total: number }> => {
    const skip = (page - 1) * limit;

    // Get top-level comments first (consultant replies prioritized)
    const [comments, total] = await Promise.all([
        prisma.comment.findMany({
            where: {
                postId,
                parentCommentId: null,
                status: CommentStatus.ACTIVE,
            },
            skip,
            take: limit,
            orderBy: [
                { isConsultantReply: "desc" },
                { createdAt: "desc" },
            ],
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        nickname: {
                            select: {
                                handle: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                replies: {
                    where: { status: CommentStatus.ACTIVE },
                    orderBy: [
                        { isConsultantReply: "desc" },
                        { createdAt: "desc" },
                    ],
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                nickname: {
                                    select: {
                                        handle: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                        replies: {
                            where: { status: CommentStatus.ACTIVE },
                            orderBy: [
                                { isConsultantReply: "desc" },
                                { createdAt: "desc" },
                            ],
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        nickname: {
                                            select: {
                                                handle: true,
                                                avatarUrl: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: { replies: true },
                },
            },
        }),
        prisma.comment.count({
            where: {
                postId,
                parentCommentId: null,
                status: CommentStatus.ACTIVE,
            },
        }),
    ]);

    return { comments: comments as ICommentWithAuthor[], total };
};

const getCommentById = async (id: string): Promise<ICommentWithAuthor | null> => {
    const comment = await prisma.comment.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    nickname: {
                        select: {
                            handle: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
    });

    return comment as ICommentWithAuthor | null;
};

const updateComment = async (
    id: string,
    userId: string,
    payload: ICommentUpdate
): Promise<IComment | null> => {
    const existingComment = await prisma.comment.findFirst({
        where: { id, authorId: userId },
    });

    if (!existingComment) {
        throw new AppError(status.NOT_FOUND, "Comment not found or you don't have permission");
    }

    const comment = await prisma.comment.update({
        where: { id },
        data: payload,
    });

    return comment as IComment;
};

const deleteComment = async (id: string, userId: string): Promise<IComment | null> => {
    const existingComment = await prisma.comment.findFirst({
        where: { id, authorId: userId },
    });

    if (!existingComment) {
        throw new AppError(status.NOT_FOUND, "Comment not found or you don't have permission");
    }

    const comment = await prisma.comment.update({
        where: { id },
        data: { status: CommentStatus.REMOVED },
    });

    return comment as IComment;
};

export const CommentService = {
    createComment,
    getCommentsByPostId,
    getCommentById,
    updateComment,
    deleteComment,
};
