import { ApplicationStatus } from "../../../../prisma/generated/prisma/enums";

export interface IConsultantApplicationCreate {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    age: number;
    hourlyRate?: number;
    availabilityDays: string[];
    availableFrom: string;
    availableTo: string;
    paymentIntentId: string;
}

export interface IConsultantApplicationReviewPayload {
    status: Extract<ApplicationStatus, "APPROVED" | "REJECTED">;
    reviewNote?: string;
}

export interface IConsultantApplicationFilters {
    status?: ApplicationStatus;
    page?: number;
    limit?: number;
}
