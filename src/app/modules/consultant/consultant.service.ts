import { VerificationStatus } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IConsultant, IConsultantCreate, IConsultantFilters, IConsultantUpdate, IConsultantWithUser } from "./consultant.interface";
import { createPaymentIntent, confirmPaymentIntent } from "../../config/stripe";

const APPLICATION_FEE_AMOUNT = 10; // $10 application fee

const toNumber = (value: number | { toNumber(): number }) =>
    typeof value === "number" ? value : value.toNumber();

const mapConsultant = (consultant: any): IConsultant => {
    const { hourlyRate, averageRating, ...rest } = consultant;

    return {
        ...rest,
        hourlyRate: toNumber(hourlyRate),
        averageRating: averageRating == null ? averageRating : toNumber(averageRating),
    };
};

const mapConsultantWithUser = (consultant: any): IConsultantWithUser => ({
    ...mapConsultant(consultant),
    user: consultant.user,
});

const createApplicationPayment = async (userId: string) => {
    // Check if user already has a consultant profile
    const existingConsultant = await prisma.consultant.findUnique({
        where: { userId },
    });

    if (existingConsultant) {
        throw new AppError(status.CONFLICT, "User already has a consultant profile");
    }

    const paymentIntent = await createPaymentIntent(APPLICATION_FEE_AMOUNT, "usd", {
        type: "consultant_application",
        userId,
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: APPLICATION_FEE_AMOUNT,
    };
};

const createConsultant = async (
    userId: string,
    payload: IConsultantCreate & { paymentIntentId: string }
): Promise<IConsultant> => {
    // Check if user already has a consultant profile
    const existingConsultant = await prisma.consultant.findUnique({
        where: { userId },
    });

    if (existingConsultant) {
        throw new AppError(status.CONFLICT, "User already has a consultant profile");
    }

    // Verify payment
    const paymentIntent = await confirmPaymentIntent(payload.paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
        throw new AppError(status.BAD_REQUEST, "Application fee payment has not been completed");
    }

    if (paymentIntent.amount !== APPLICATION_FEE_AMOUNT * 100) {
        throw new AppError(status.BAD_REQUEST, "Invalid payment amount for application fee");
    }

    const consultant = await prisma.consultant.create({
        data: {
            professionalTitle: payload.professionalTitle,
            licenseNumber: payload.licenseNumber,
            bio: payload.bio,
            hourlyRate: payload.hourlyRate,
            yearsExperience: payload.yearsExperience,
            specializations: payload.specializations as any,
            userId,
            verificationStatus: VerificationStatus.PENDING,
            applicationPaymentId: payload.paymentIntentId,
        },
    });

    return mapConsultant(consultant);
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
                        image: true,
                        age: true,
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

    return { consultants: consultants.map(mapConsultantWithUser), total };
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
                    image: true,
                    age: true,
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

    return consultant ? mapConsultantWithUser(consultant) : null;
};

const getConsultantByUserId = async (userId: string): Promise<IConsultant | null> => {
    const consultant = await prisma.consultant.findUnique({
        where: { userId },
    });

    return consultant ? mapConsultant(consultant) : null;
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

    return mapConsultant(consultant);
};

const updateVerificationStatus = async (
    id: string,
    verificationStatus: VerificationStatus
): Promise<IConsultant | null> => {
    const consultant = await prisma.consultant.update({
        where: { id },
        data: { verificationStatus },
    });

    return mapConsultant(consultant);
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

    return { consultants: consultants.map(mapConsultantWithUser), total };
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
    createApplicationPayment,
    createConsultant,
    getAllConsultants,
    getConsultantById,
    getConsultantByUserId,
    updateConsultant,
    updateVerificationStatus,
    getPendingVerifications,
    getSpecializations,
};
