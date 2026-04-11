import { z } from "zod";
import { CommentStatus } from "../../../../prisma/generated/prisma/enums";

const createCommentSchema = z.object({
    content: z
        .string()
        .min(1, "Content is required")
        .max(1000, "Content must be at most 1000 characters"),
    parentCommentId: z.string().optional(),
});

const updateCommentSchema = z.object({
    content: z
        .string()
        .min(1, "Content is required")
        .max(1000, "Content must be at most 1000 characters")
        .optional(),
    status: z.nativeEnum(CommentStatus).optional(),
});

export const CommentValidation = {
    createCommentSchema,
    updateCommentSchema,
};
