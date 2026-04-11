import { z } from "zod";
import { BookingStatus } from "../../../generated/prisma/enums";

const createBookingSchema = z.object({
    consultantId: z.string().min(1, "Consultant ID is required"),
    scheduledAt: z.string().datetime("Invalid date format"),
    durationMinutes: z.number().int().min(30).max(120).optional().default(60),
    preSessionNotes: z.string().max(2000, "Notes must be at most 2000 characters").optional(),
});

const updateBookingSchema = z.object({
    scheduledAt: z.string().datetime().optional(),
    durationMinutes: z.number().int().min(30).max(120).optional(),
    preSessionNotes: z.string().max(2000).optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    postSessionNotes: z.string().max(2000).optional(),
});

const bookingFiltersSchema = z.object({
    status: z.nativeEnum(BookingStatus).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
});

export const BookingValidation = {
    createBookingSchema,
    updateBookingSchema,
    bookingFiltersSchema,
};
