import { z } from "zod";

const handleRegex = /^[a-zA-Z0-9_]+$/;

const createNicknameSchema = z.object({
    handle: z
        .string()
        .min(3, "Handle must be at least 3 characters")
        .max(30, "Handle must be at most 30 characters")
        .regex(handleRegex, "Handle can only contain letters, numbers, and underscores"),
    avatarUrl: z.string().url("Invalid URL").optional(),
});

const updateNicknameSchema = z.object({
    avatarUrl: z.string().url("Invalid URL").optional(),
});

const rotateNicknameSchema = z.object({
    newHandle: z
        .string()
        .min(3, "Handle must be at least 3 characters")
        .max(30, "Handle must be at most 30 characters")
        .regex(handleRegex, "Handle can only contain letters, numbers, and underscores"),
});

export const NicknameValidation = {
    createNicknameSchema,
    updateNicknameSchema,
    rotateNicknameSchema,
};
