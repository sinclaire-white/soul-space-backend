import { VerificationStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IConsultant, IConsultantCreate, IConsultantFilters, IConsultantUpdate, IConsultantWithUser } from "./consultant.interface";

const createConsultant = async (
    userId: string,
    payload: IConsultantCreate
): Promise<IConsultant> => {
    // Check if user already has a consultant profile
    const existingConsultant = await prisma.consultant.findUnique({
        where: { userId },
    });

    if (existingConsultant) {
        throw new AppError(status.CONFLICT, "User already has a consultant profile");
    }

    const consultant = await prisma.consultant.create({
        data: {
            ...payload,
            userId,
            specializations: payload.specializations as any,
            verificationStatus: VerificationStatus.PENDING,
        },
    });

    return consultant as IConsultant;
};

const getAllConsultants = async (
    filters: IConsultantFilters,
    page: number = 1,
    limit: number = 10
): Promise<{ consultants: IConsultantWithUser[]; total: number }> => {
    const where: any = {
        verificationStatus: VerificationStatus.VERIFIED,
    };

    if (filters.specialization) {
        where.specializations = {
            array_contains: filters.specialization,
        };
    }

    if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
    }

    if (filters.minRating) {
        where.averageRating = {
            gte: filters.minRating,
        };
    }

    if (filters.maxPrice) {
        where.hourlyRate = {
            lte: filters.maxPrice,
        };
    }

    const skip = (page - 1) * limit;

    const [consultants, total] = await Promise.all([
        prisma.consultant.findMany({
            where,
            skip,
            take: limit,
            orderBy: { averageRating: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        nickname: {
                            select: {
                                handle: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.consultant.count({ where }),
    ]);

    return { consultants: consultants as IConsultantWithUser[], total };
};

const getConsultantById = async (id: string): Promise<IConsultantWithUser | null> => {
    const consultant = await prisma.consultant.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    nickname: {
                        select: {
                            handle: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
            availabilities: true,
        },
    });

    return consultant as IConsultantWithUser | null;
};

const getConsultantByUserId = async (userId: string): Promise<IConsultant | null> => {
    const consultant = await prisma.consultant.findUnique({
        where: { userId },
    });

    return consultant as IConsultant | null;
};

const updateConsultant = async (
    userId: string,
    payload: IConsultantUpdate
): Promise<IConsultant | null> => {
    const consultant = await prisma.consultant.update({
        where: { userId },
        data: {
            ...payload,
            specializations: payload.specializations as any,
        },
    });

    return consultant as IConsultant;
};

const updateVerificationStatus = async (
    id: string,
    verificationStatus: VerificationStatus
): Promise<IConsultant | null> => {
    const consultant = await prisma.consultant.update({
        where: { id },
        data: { verificationStatus },
    });

    return consultant as IConsultant;
};

const getPendingVerifications = async (
    page: number = 1,
    limit: number = 10
): Promise<{ consultants: IConsultantWithUser[]; total: number }> => {
    const skip = (page - 1) * limit;

    const [consultants, total] = await Promise.all([
        prisma.consultant.findMany({
            where: { verificationStatus: VerificationStatus.PENDING },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        }),
        prisma.consultant.count({
            where: { verificationStatus: VerificationStatus.PENDING },
        }),
    ]);

    return { consultants: consultants as IConsultantWithUser[], total };
};

const getSpecializations = async (): Promise<string[]> => {
    const consultants = await prisma.consultant.findMany({
        where: { verificationStatus: VerificationStatus.VERIFIED },
        select: { specializations: true },
    });

    const specializationsSet = new Set<string>();
    consultants.forEach((consultant) => {
        (consultant.specializations as string[]).forEach((spec) => {
            specializationsSet.add(spec);
        });
    });

    return Array.from(specializationsSet).sort();
};

export const ConsultantService = {
    createConsultant,
    getAllConsultants,
    getConsultantById,
    getConsultantByUserId,
    updateConsultant,
    updateVerificationStatus,
    getPendingVerifications,
    getSpecializations,
};
