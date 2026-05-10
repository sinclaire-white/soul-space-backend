import { z } from "zod";
import { PostVisibility, UserRole } from "../../../../prisma/generated/prisma/enums";

const createUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    role: z.nativeEnum(UserRole).optional(),
});

const updateUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().max(20, "Phone number too long").optional().nullable(),
    age: z.coerce.number().int().min(13, "Must be at least 13 years old").max(120, "Invalid age").optional().nullable(),
    bio: z.string().max(500, "Bio must be 500 characters or less").optional().nullable(),
    defaultPostVisibility: z.nativeEnum(PostVisibility).optional(),
    isProfilePublic: z.boolean().optional(),
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
