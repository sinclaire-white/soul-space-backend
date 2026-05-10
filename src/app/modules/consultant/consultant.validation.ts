import { z } from "zod";
import { VerificationStatus } from "../../../../prisma/generated/prisma/enums";

const createConsultantSchema = z.object({
    professionalTitle: z.string().min(2, "Professional title is required"),
    licenseNumber: z.string().optional(),
    bio: z.string().max(1000, "Bio must be at most 1000 characters").optional(),
    hourlyRate: z.number().positive("Hourly rate must be positive"),
    yearsExperience: z.number().int().nonnegative("Years of experience must be non-negative"),
    specializations: z.array(z.string()).min(1, "At least one specialization is required"),
    paymentIntentId: z.string().min(1, "Payment intent ID is required"),
});

const updateConsultantSchema = z.object({
    professionalTitle: z.string().min(2).optional(),
    bio: z.string().max(1000).optional(),
    hourlyRate: z.number().positive().optional(),
    yearsExperience: z.number().int().nonnegative().optional(),
    specializations: z.array(z.string()).optional(),
    isAvailable: z.boolean().optional(),
});

const updateVerificationSchema = z.object({
    verificationStatus: z.nativeEnum(VerificationStatus),
});

const consultantFiltersSchema = z.object({
    verificationStatus: z.nativeEnum(VerificationStatus).optional(),
    specialization: z.string().optional(),
    isAvailable: z.boolean().optional(),
    minRating: z.number().optional(),
    maxPrice: z.number().optional(),
});

export const ConsultantValidation = {
    createConsultantSchema,
    updateConsultantSchema,
    updateVerificationSchema,
    consultantFiltersSchema,
};
