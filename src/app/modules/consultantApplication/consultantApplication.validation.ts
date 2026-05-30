import { z } from "zod";
import { ApplicationStatus } from "../../../../prisma/generated/prisma/enums";

const createApplicationSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(5, "Phone is required"),
    address: z.string().min(5, "Clinic or hospital address is required"),
    age: z.preprocess(
        (value) => Number(value),
        z.number().int().min(18, "Age must be at least 18")
    ),
    hourlyRate: z.preprocess(
        (value) => (typeof value === "string" ? Number(value) : value),
        z.number().positive("Hourly rate must be a positive number").optional()
    ),
    availabilityDays: z.preprocess((value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    }, z.array(z.string()).min(1, "Select at least one availability day")),
    availableFrom: z.string().min(1, "Availability start time is required"),
    availableTo: z.string().min(1, "Availability end time is required"),
    paymentIntentId: z.string().min(1, "Payment intent ID is required"),
});

const reviewApplicationSchema = z.object({
    status: z.enum([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]),
    reviewNote: z.string().max(1000).optional(),
});

export const ConsultantApplicationValidation = {
    createApplicationSchema,
    reviewApplicationSchema,
};
