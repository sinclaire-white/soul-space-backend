import { VerificationStatus } from "../../../../prisma/generated/prisma/enums";

export interface IConsultant {
    id: string;
    userId: string;
    verificationStatus: VerificationStatus;
    professionalTitle: string;
    licenseNumber?: string | null;
    bio?: string | null;
    hourlyRate: number;
    yearsExperience: number;
    specializations: string[];
    averageRating?: number | null;
    totalSessions: number;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IConsultantCreate {
    professionalTitle: string;
    licenseNumber?: string;
    bio?: string;
    hourlyRate: number;
    yearsExperience: number;
    specializations: string[];
}

export interface IConsultantUpdate {
    professionalTitle?: string;
    bio?: string;
    hourlyRate?: number;
    yearsExperience?: number;
    specializations?: string[];
    isAvailable?: boolean;
}

export interface IConsultantFilters {
    verificationStatus?: VerificationStatus;
    specialization?: string;
    isAvailable?: boolean;
    minRating?: number;
    maxPrice?: number;
}

export interface IConsultantWithUser extends IConsultant {
    user: {
        id: string;
        name?: string | null;
        email: string;
        nickname?: {
            handle: string;
            avatarUrl?: string | null;
        } | null;
    };
}
