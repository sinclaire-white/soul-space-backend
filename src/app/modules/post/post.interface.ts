import { PostStatus, PostVisibility } from "../../../generated/prisma/enums";

export interface IPost {
    id: string;
    authorId: string;
    nicknameId?: string | null;
    content: string;
    status: PostStatus;
    isAnonymous: boolean;
    visibleTo: PostVisibility;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface IPostCreate {
    content: string;
    isAnonymous?: boolean;
    visibleTo?: PostVisibility;
}

export interface IPostUpdate {
    content?: string;
    status?: PostStatus;
}

export interface IPostFilters {
    status?: PostStatus;
    visibleTo?: PostVisibility;
    authorId?: string;
    isAnonymous?: boolean;
}

export interface IPostWithAuthor extends IPost {
    author: {
        id: string;
        nickname?: {
            handle: string;
            avatarUrl?: string | null;
        } | null;
    };
    _count?: {
        comments: number;
        reactions: number;
    };
}
