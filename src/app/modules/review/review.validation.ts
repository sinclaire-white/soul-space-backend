import { z } from "zod";

const createReviewSchema = z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
    content: z.string().max(1000, "Review must be at most 1000 characters").optional(),
    isPublic: z.boolean().optional().default(true),
});

const updateReviewSchema = z.object({
    rating: z.number().int().min(1).max(5).optional(),
    content: z.string().max(1000).optional(),
    isPublic: z.boolean().optional(),
});

const reviewFiltersSchema = z.object({
    consultantId: z.string().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    isPublic: z.boolean().optional(),
});

export const ReviewValidation = {
    createReviewSchema,
    updateReviewSchema,
    reviewFiltersSchema,
};
