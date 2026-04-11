import { z } from "zod";
import { PostVisibility, UserRole } from "../../../../prisma/generated/prisma/enums";

const createUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    role: z.nativeEnum(UserRole).optional(),
});

const updateUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    defaultPostVisibility: z.nativeEnum(PostVisibility).optional(),
});

const updateUserRoleSchema = z.object({
    role: z.nativeEnum(UserRole),
});

const userFiltersSchema = z.object({
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
    search: z.string().optional(),
});

export const UserValidation = {
    createUserSchema,
    updateUserSchema,
    updateUserRoleSchema,
    userFiltersSchema,
};
