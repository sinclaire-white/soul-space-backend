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
