import { z } from "zod";
import { PostStatus, PostVisibility } from "../../../../prisma/generated/prisma/enums";

const createPostSchema = z.object({
    content: z
        .string()
        .min(1, "Content is required")
        .max(2000, "Content must be at most 2000 characters"),
    isAnonymous: z.boolean().optional().default(false),
    visibleTo: z.nativeEnum(PostVisibility).optional().default(PostVisibility.PUBLIC),
});

const updatePostSchema = z.object({
    content: z
        .string()
        .min(1, "Content is required")
        .max(2000, "Content must be at most 2000 characters")
        .optional(),
    status: z.nativeEnum(PostStatus).optional(),
});

const postFiltersSchema = z.object({
    status: z.nativeEnum(PostStatus).optional(),
    visibleTo: z.nativeEnum(PostVisibility).optional(),
    authorId: z.string().optional(),
    isAnonymous: z.boolean().optional(),
});

export const PostValidation = {
    createPostSchema,
    updatePostSchema,
    postFiltersSchema,
};
