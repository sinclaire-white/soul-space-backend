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

    const availabilityDays = Array.isArray(payload.availabilityDays)
        ? payload.availabilityDays
        : JSON.parse(payload.availabilityDays as unknown as string || "[]");

    if (existingApplication) {
        return prisma.consultantApplication.update({
            where: { id: existingApplication.id },
            data: {
                fullName: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                address: payload.address,
                age: payload.age,
                hourlyRate: payload.hourlyRate,
                availabilityDays,
                availableFrom: payload.availableFrom,
                availableTo: payload.availableTo,
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
            hourlyRate: payload.hourlyRate,
            availabilityDays,
            availableFrom: payload.availableFrom,
            availableTo: payload.availableTo,
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
                        professionalTitle: application.fullName,
                        bio: `Certified professional with experience in mental health services.`,
                        address: application.address,
                        hourlyRate: application.hourlyRate || 0,
                        yearsExperience: 0,
                        specializations: [],
                        verificationStatus: VerificationStatus.VERIFIED,
                        applicationPaymentId: application.paymentIntentId,
                    },
                });
            }

            // Create recurring consultant availability rows from the application availabilityDays
            // If the applicant provided availabilityDays and time window, create availability entries
            try {
                const availabilityDays: string[] = application.availabilityDays ?? [];
                const from = application.availableFrom; // e.g. "10:00"
                const to = application.availableTo; // e.g. "18:00"

                if (availabilityDays && availabilityDays.length && from && to) {
                    const dayNameToIndex: Record<string, number> = {
                        Sunday: 0,
                        Monday: 1,
                        Tuesday: 2,
                        Wednesday: 3,
                        Thursday: 4,
                        Friday: 5,
                        Saturday: 6,
                    };

                    const existing = await tx.consultant.findUnique({ where: { userId: application.userId } });
                    const consultantId = existing?.id;

                    if (consultantId) {
                        for (const dayName of availabilityDays) {
                            const dayIndex = dayNameToIndex[dayName];
                            if (dayIndex === undefined) continue;

                            // Only create if there's no availability for that day yet
                            const already = await tx.consultantAvailability.findFirst({ where: { consultantId, dayOfWeek: dayIndex } });
                            if (already) continue;

                            // Parse times into Date using a neutral base date (UTC)
                            const base = new Date("2000-01-01T00:00:00.000Z");
                            const [fromH, fromM] = from.split(":").map(Number);
                            const [toH, toM] = to.split(":").map(Number);
                            const startTime = new Date(base);
                            startTime.setUTCHours(fromH ?? 0, fromM ?? 0, 0, 0);
                            const endTime = new Date(base);
                            endTime.setUTCHours(toH ?? 0, toM ?? 0, 0, 0);

                            await tx.consultantAvailability.create({
                                data: {
                                    consultantId,
                                    dayOfWeek: dayIndex,
                                    startTime,
                                    endTime,
                                    isRecurring: true,
                                    isBlocked: false,
                                },
                            });
                        }
                    }
                }
            } catch (e) {
                // don't fail the whole transaction if availability creation fails; log for manual inspection
                
                console.error("Failed to create availabilities from application:", e);
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