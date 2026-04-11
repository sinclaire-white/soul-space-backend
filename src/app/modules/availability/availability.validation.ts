import { z } from "zod";

const createAvailabilitySchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6, "Day must be 0-6 (Sunday-Saturday)"),
    startTime: z.string().datetime("Invalid start time"),
    endTime: z.string().datetime("Invalid end time"),
    isRecurring: z.boolean().optional().default(true),
    isBlocked: z.boolean().optional().default(false),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
});

const updateAvailabilitySchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    isRecurring: z.boolean().optional(),
    isBlocked: z.boolean().optional(),
});

const getSlotsSchema = z.object({
    consultantId: z.string().min(1, "Consultant ID is required"),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
});

export const AvailabilityValidation = {
    createAvailabilitySchema,
    updateAvailabilitySchema,
    getSlotsSchema,
};
