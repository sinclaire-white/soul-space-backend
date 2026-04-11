import { ReactionType } from "../../../generated/prisma/enums";

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
    SUPPORT: number;
    HUG: number;
    RELATE: number;
    THANKS: number;
    STRENGTH: number;
}

export interface IPostReactions {
    postId: string;
    totalReactions: number;
    counts: IReactionCounts;
    userReaction?: ReactionType | null;
}
