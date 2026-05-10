import status from "http-status";
import { ApplicationStatus, UserRole, VerificationStatus } from "../../../../prisma/generated/prisma/enums";
import { confirmPaymentIntent, createPaymentIntent } from "../../config/stripe";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { uploadToCloudinary } from "../../config/cloudinary";
import {
    IConsultantApplicationCreate,
    IConsultantApplicationFilters,
    IConsultantApplicationReviewPayload,
} from "./consultantApplication.interface";

const APPLICATION_FEE_AMOUNT = 10;

const createApplicationPayment = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if (user.role === UserRole.CONSULTANT) {
        throw new AppError(status.CONFLICT, "You are already a consultant");
    }

    const pendingApplication = await prisma.consultantApplication.findFirst({
        where: {
            userId,
            status: ApplicationStatus.PENDING,
        },
    });

    if (pendingApplication) {
        throw new AppError(status.CONFLICT, "You already have a pending consultant application");
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

const submitApplication = async (
    userId: string,
    payload: IConsultantApplicationCreate,
    documentFile?: Express.Multer.File
) => {
    if (!documentFile) {
        throw new AppError(status.BAD_REQUEST, "Certification PDF is required");
    }

    const paymentIntent = await confirmPaymentIntent(payload.paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
        throw new AppError(status.BAD_REQUEST, "Application fee payment has not been completed");
    }

    if (paymentIntent.amount !== APPLICATION_FEE_AMOUNT * 100) {
        throw new AppError(status.BAD_REQUEST, "Invalid payment amount for application fee");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if (user.role === UserRole.CONSULTANT) {
        throw new AppError(status.CONFLICT, "You are already a consultant");
    }

    const dataUri = `data:${documentFile.mimetype};base64,${documentFile.buffer.toString("base64")}`;
    const uploaded = await uploadToCloudinary(dataUri, "soul-space/consultant-certifications");

    const existingApplication = await prisma.consultantApplication.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    if (existingApplication?.status === ApplicationStatus.PENDING) {
        throw new AppError(status.CONFLICT, "You already have a pending consultant application");
    }

    if (existingApplication) {
        return prisma.consultantApplication.update({
            where: { id: existingApplication.id },
            data: {
                fullName: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                address: payload.address,
                age: payload.age,
                certificationDocumentUrl: uploaded.url,
                paymentIntentId: payload.paymentIntentId,
                status: ApplicationStatus.PENDING,
                reviewNote: null,
                reviewedAt: null,
                reviewedById: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    return prisma.consultantApplication.create({
        data: {
            userId,
            fullName: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            age: payload.age,
            certificationDocumentUrl: uploaded.url,
            paymentIntentId: payload.paymentIntentId,
            status: ApplicationStatus.PENDING,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
};

const getMyApplication = async (userId: string) => {
    return prisma.consultantApplication.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            reviewedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
};

const getApplicationsForAdmin = async (filters: IConsultantApplicationFilters) => {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = filters.status
        ? {
            status: filters.status,
        }
        : undefined;

    const [applications, total] = await Promise.all([
        prisma.consultantApplication.findMany({
            where,
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
                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        }),
        prisma.consultantApplication.count({ where }),
    ]);

    return {
        applications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

const reviewApplication = async (
    applicationId: string,
    reviewerId: string,
    payload: IConsultantApplicationReviewPayload
) => {
    const application = await prisma.consultantApplication.findUnique({
        where: { id: applicationId },
        include: { user: true },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Consultant application not found");
    }

    if (application.status !== ApplicationStatus.PENDING) {
        throw new AppError(status.BAD_REQUEST, "Only pending applications can be reviewed");
    }

    const reviewed = await prisma.$transaction(async (tx) => {
        const updatedApplication = await tx.consultantApplication.update({
            where: { id: applicationId },
            data: {
                status: payload.status,
                reviewNote: payload.reviewNote,
                reviewedAt: new Date(),
                reviewedById: reviewerId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (payload.status === ApplicationStatus.APPROVED) {
            await tx.user.update({
                where: { id: application.userId },
                data: { role: UserRole.CONSULTANT },
            });

            const existingConsultant = await tx.consultant.findUnique({
                where: { userId: application.userId },
            });

            if (!existingConsultant) {
                await tx.consultant.create({
                    data: {
                        userId: application.userId,
                        professionalTitle: "Verified Consultant",
                        bio: "Consultant account approved by admin.",
                        hourlyRate: 0,
                        yearsExperience: 0,
                        specializations: [],
                        verificationStatus: VerificationStatus.VERIFIED,
                        applicationPaymentId: application.paymentIntentId,
                    },
                });
            }
        }

        return updatedApplication;
    });

    return reviewed;
};

export const ConsultantApplicationService = {
    createApplicationPayment,
    submitApplication,
    getMyApplication,
    getApplicationsForAdmin,
    reviewApplication,
};
