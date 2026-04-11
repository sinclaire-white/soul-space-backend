import { ReactionType } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IReaction, IReactionCreate, IReactionCounts, IPostReactions } from "./reaction.interface";

const createOrUpdateReaction = async (
    postId: string,
    userId: string,
    payload: IReactionCreate
): Promise<IReaction> => {
    // Check if post exists and is active
    const post = await prisma.post.findFirst({
        where: { id: postId, status: { not: "REMOVED" }, deletedAt: null },
    });

    if (!post) {
        throw new AppError(status.NOT_FOUND, "Post not found");
    }

    // Check if user is trying to react to their own post
    if (post.authorId === userId) {
        throw new AppError(status.FORBIDDEN, "You cannot react to your own post");
    }

    // Check if user already has a reaction on this post
    const existingReaction = await prisma.reaction.findUnique({
        where: {
            userId_postId: {
                userId,
                postId,
            },
        },
    });

    let reaction;

    if (existingReaction) {
        // Update existing reaction if type is different
        if (existingReaction.reactionType !== payload.reactionType) {
            reaction = await prisma.reaction.update({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
                data: {
                    reactionType: payload.reactionType,
                },
            });
        } else {
            // Same reaction type - return existing
            reaction = existingReaction;
        }
    } else {
        // Create new reaction
        reaction = await prisma.reaction.create({
            data: {
                userId,
                postId,
                reactionType: payload.reactionType,
            },
        });
    }

    return reaction as IReaction;
};

const removeReaction = async (postId: string, userId: string): Promise<void> => {
    const existingReaction = await prisma.reaction.findUnique({
        where: {
            userId_postId: {
                userId,
                postId,
            },
        },
    });

    if (!existingReaction) {
        throw new AppError(status.NOT_FOUND, "Reaction not found");
    }

    await prisma.reaction.delete({
        where: {
            userId_postId: {
                userId,
                postId,
            },
        },
    });
};

const getPostReactions = async (
    postId: string,
    userId?: string
): Promise<IPostReactions> => {
    const reactions = await prisma.reaction.findMany({
        where: { postId },
    });

    const counts: IReactionCounts = {
        SUPPORT: 0,
        HUG: 0,
        RELATE: 0,
        THANKS: 0,
        STRENGTH: 0,
    };

    reactions.forEach((reaction) => {
        counts[reaction.reactionType]++;
    });

    const totalReactions = reactions.length;

    let userReaction: ReactionType | null = null;
    if (userId) {
        const userReactionRecord = await prisma.reaction.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        userReaction = userReactionRecord?.reactionType || null;
    }

    return {
        postId,
        totalReactions,
        counts,
        userReaction,
    };
};

const getUserReactions = async (userId: string): Promise<IReaction[]> => {
    const reactions = await prisma.reaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            post: {
                select: {
                    id: true,
                    content: true,
                    authorId: true,
                },
            },
        },
    });

    return reactions as IReaction[];
};

const getTrendingPosts = async (limit: number = 10): Promise<string[]> => {
    // Get posts with most reactions in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingPosts = await prisma.reaction.groupBy({
        by: ["postId"],
        where: {
            createdAt: {
                gte: sevenDaysAgo,
            },
        },
        _count: {
            postId: true,
        },
        orderBy: {
            _count: {
                postId: "desc",
            },
        },
        take: limit,
    });

    return trendingPosts.map((post) => post.postId);
};

export const ReactionService = {
    createOrUpdateReaction,
    removeReaction,
    getPostReactions,
    getUserReactions,
    getTrendingPosts,
};
