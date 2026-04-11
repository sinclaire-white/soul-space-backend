import { CommentStatus } from "../../../../prisma/generated/prisma/enums";

export interface IComment {
    id: string;
    postId: string;
    authorId: string;
    parentCommentId?: string | null;
    content: string;
    isConsultantReply: boolean;
    status: CommentStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICommentCreate {
    content: string;
    parentCommentId?: string;
}

export interface ICommentUpdate {
    content?: string;
    status?: CommentStatus;
}

export interface ICommentWithAuthor extends IComment {
    author: {
        id: string;
        nickname?: {
            handle: string;
            avatarUrl?: string | null;
        } | null;
    };
    replies?: ICommentWithAuthor[];
    _count?: {
        replies: number;
    };
}
