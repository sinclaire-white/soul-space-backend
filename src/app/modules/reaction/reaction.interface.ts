import { ReactionType } from "../../../../prisma/generated/prisma/enums";

export interface IReaction {
    id: string;
    userId: string;
    postId: string;
    reactionType: ReactionType;
    createdAt: Date;
}

export interface IReactionCreate {
    reactionType: ReactionType;
}

export interface IReactionCounts {
    [key: string]: number;
    UPVOTE: number;
    DOWNVOTE: number;
}

export interface IPostReactions {
    postId: string;
    totalReactions: number;
    upvotes: number;
    downvotes: number;
    userReaction?: ReactionType | null;
}
