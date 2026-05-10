import { z } from "zod";

const updateUserSchema = z.object({
    body: z.object({
        role: z.enum(["USER", "CONSULTANT", "ADMIN", "SUPER_ADMIN"]).optional(),
        isActive: z.boolean().optional(),
        emailVerified: z.boolean().optional(),
    }),
});

const moderationSchema = z.object({
    body: z.object({
        action: z.enum(["WARN", "SUSPEND", "BAN", "REINSTATE"]),
        reason: z.string().min(1, "Reason is required"),
        duration: z.number().int().positive().optional(), // days for suspension
    }),
});

const updatePostSchema = z.object({
    body: z.object({
        status: z.enum(["ACTIVE", "HIDDEN_BY_USER", "UNDER_REVIEW", "REMOVED"]).optional(),
    }),
});

export const AdminValidation = {
    updateUserSchema,
    moderationSchema,
    updatePostSchema,
};
