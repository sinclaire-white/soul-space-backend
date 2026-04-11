import { BookingStatus } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IReview, IReviewCreate, IReviewFilters, IReviewStats, IReviewUpdate, IReviewWithDetails } from "./review.interface";

const REVIEW_WINDOW_HOURS = 72; // 3 days

const createReview = async (
    clientId: string,
    payload: IReviewCreate
): Promise<IReview> => {
    // Check if booking exists and is completed
    const booking = await prisma.booking.findFirst({
        where: {
            id: payload.bookingId,
            clientId,
            status: BookingStatus.COMPLETED,
        },
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found or not completed");
    }

    // Check if review already exists for this booking
    const existingReview = await prisma.review.findUnique({
        where: { bookingId: payload.bookingId },
    });

    if (existingReview) {
        throw new AppError(status.CONFLICT, "Review already exists for this booking");
    }

    // Check if within review window (72 hours)
    const completedAt = new Date(booking.updatedAt);
    const now = new Date();
    const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCompletion > REVIEW_WINDOW_HOURS) {
        throw new AppError(
            status.BAD_REQUEST,
            `Review window has expired. Reviews must be submitted within ${REVIEW_WINDOW_HOURS} hours`
        );
    }

    const review = await prisma.review.create({
        data: {
            ...payload,
            clientId,
            consultantId: booking.consultantId,
        },
    });

    // Update consultant average rating
    await updateConsultantRating(booking.consultantId);

    return review as IReview;
};

const updateConsultantRating = async (consultantId: string): Promise<void> => {
    const reviews = await prisma.review.findMany({
        where: { consultantId, isPublic: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    await prisma.consultant.update({
        where: { id: consultantId },
        data: {
            averageRating,
            totalSessions: totalReviews,
        },
    });
};

const getReviewsByConsultant = async (
    consultantId: string,
    filters: IReviewFilters,
    page: number = 1,
    limit: number = 10
): Promise<{ reviews: IReviewWithDetails[]; total: number }> => {
    const where: any = { consultantId };

    if (filters.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
    }

    if (filters.rating) {
        where.rating = filters.rating;
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: {
                        id: true,
                        nickname: {
                            select: {
                                handle: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.review.count({ where }),
    ]);

    return { reviews: reviews as IReviewWithDetails[], total };
};

const getMyReviews = async (
    clientId: string,
    page: number = 1,
    limit: number = 10
): Promise<{ reviews: IReviewWithDetails[]; total: number }> => {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where: { clientId },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                consultant: {
                    include: {
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.review.count({ where: { clientId } }),
    ]);

    return { reviews: reviews as IReviewWithDetails[], total };
};

const getReviewById = async (id: string): Promise<IReviewWithDetails | null> => {
    const review = await prisma.review.findUnique({
        where: { id },
        include: {
            client: {
                select: {
                    id: true,
                    nickname: {
                        select: {
                            handle: true,
                        },
                    },
                },
            },
            consultant: {
                include: {
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });

    return review as IReviewWithDetails | null;
};

const updateReview = async (
    id: string,
    clientId: string,
    payload: IReviewUpdate
): Promise<IReview | null> => {
    const existingReview = await prisma.review.findFirst({
        where: { id, clientId },
    });

    if (!existingReview) {
        throw new AppError(status.NOT_FOUND, "Review not found or you don't have permission");
    }

    const review = await prisma.review.update({
        where: { id },
        data: payload,
    });

    // Update consultant rating if rating changed
    if (payload.rating) {
        await updateConsultantRating(existingReview.consultantId);
    }

    return review as IReview;
};

const hideReview = async (id: string, consultantId: string): Promise<IReview | null> => {
    const existingReview = await prisma.review.findFirst({
        where: {
            id,
            consultant: { userId: consultantId },
        },
    });

    if (!existingReview) {
        throw new AppError(status.NOT_FOUND, "Review not found");
    }

    const review = await prisma.review.update({
        where: { id },
        data: { isPublic: false },
    });

    // Update consultant rating
    await updateConsultantRating(existingReview.consultantId);

    return review as IReview;
};

const getReviewStats = async (consultantId: string): Promise<IReviewStats> => {
    const reviews = await prisma.review.findMany({
        where: { consultantId, isPublic: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    };

    reviews.forEach((review) => {
        ratingDistribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
    });

    return {
        consultantId,
        averageRating: Math.round(averageRating * 100) / 100,
        totalReviews,
        ratingDistribution,
    };
};

export const ReviewService = {
    createReview,
    getReviewsByConsultant,
    getMyReviews,
    getReviewById,
    updateReview,
    hideReview,
    getReviewStats,
};
