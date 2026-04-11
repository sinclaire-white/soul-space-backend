import { BookingStatus, PaymentStatus } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IBooking, IBookingCreate, IBookingFilters, IBookingUpdate, IBookingWithDetails } from "./booking.interface";

const MIN_ADVANCE_HOURS = 24;
const MAX_ADVANCE_DAYS = 28;

const createBooking = async (
    clientId: string,
    payload: IBookingCreate
): Promise<IBooking> => {
    // Check if consultant exists and is verified
    const consultant = await prisma.consultant.findFirst({
        where: {
            id: payload.consultantId,
            verificationStatus: "VERIFIED",
            isAvailable: true,
        },
    });

    if (!consultant) {
        throw new AppError(status.NOT_FOUND, "Consultant not found or not available");
    }

    // Check if user is trying to book themselves
    if (consultant.userId === clientId) {
        throw new AppError(status.BAD_REQUEST, "You cannot book yourself");
    }

    const scheduledAt = new Date(payload.scheduledAt);
    const now = new Date();

    // Check minimum advance notice (24 hours)
    const hoursUntilSession = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilSession < MIN_ADVANCE_HOURS) {
        throw new AppError(
            status.BAD_REQUEST,
            `Bookings must be made at least ${MIN_ADVANCE_HOURS} hours in advance`
        );
    }

    // Check maximum advance booking (4 weeks)
    const daysUntilSession = hoursUntilSession / 24;
    if (daysUntilSession > MAX_ADVANCE_DAYS) {
        throw new AppError(
            status.BAD_REQUEST,
            `Bookings cannot be made more than ${MAX_ADVANCE_DAYS} days in advance`
        );
    }

    // Check for scheduling conflicts
    const conflictingBooking = await prisma.booking.findFirst({
        where: {
            consultantId: payload.consultantId,
            status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
            scheduledAt: {
                lte: new Date(scheduledAt.getTime() + (payload.durationMinutes || 60) * 60000),
            },
            AND: {
                scheduledAt: {
                    gte: new Date(scheduledAt.getTime() - (payload.durationMinutes || 60) * 60000),
                },
            },
        },
    });

    if (conflictingBooking) {
        throw new AppError(status.CONFLICT, "This time slot is already booked");
    }

    const booking = await prisma.booking.create({
        data: {
            clientId,
            consultantId: payload.consultantId,
            scheduledAt,
            durationMinutes: payload.durationMinutes || 60,
            preSessionNotes: payload.preSessionNotes,
            pricePaid: consultant.hourlyRate.toNumber(),
            paymentStatus: PaymentStatus.PENDING,
            status: BookingStatus.PENDING,
        },
    });

    return booking as IBooking;
};

const getMyBookings = async (
    clientId: string,
    filters: IBookingFilters,
    page: number = 1,
    limit: number = 10
): Promise<{ bookings: IBookingWithDetails[]; total: number }> => {
    const where: any = { clientId };

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
        where.scheduledAt = {};
        if (filters.fromDate) {
            where.scheduledAt.gte = filters.fromDate;
        }
        if (filters.toDate) {
            where.scheduledAt.lte = filters.toDate;
        }
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { scheduledAt: "desc" },
            include: {
                consultant: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                nickname: {
                                    select: {
                                        handle: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
        prisma.booking.count({ where }),
    ]);

    return { bookings: bookings as IBookingWithDetails[], total };
};

const getConsultantBookings = async (
    consultantId: string,
    filters: IBookingFilters,
    page: number = 1,
    limit: number = 10
): Promise<{ bookings: IBookingWithDetails[]; total: number }> => {
    const where: any = { consultantId };

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
        where.scheduledAt = {};
        if (filters.fromDate) {
            where.scheduledAt.gte = filters.fromDate;
        }
        if (filters.toDate) {
            where.scheduledAt.lte = filters.toDate;
        }
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { scheduledAt: "desc" },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        nickname: {
                            select: {
                                handle: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.booking.count({ where }),
    ]);

    return { bookings: bookings as IBookingWithDetails[], total };
};

const getBookingById = async (id: string): Promise<IBookingWithDetails | null> => {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
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
                            nickname: {
                                select: {
                                    handle: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    return booking as IBookingWithDetails | null;
};

const updateBooking = async (
    id: string,
    userId: string,
    payload: IBookingUpdate
): Promise<IBooking | null> => {
    const booking = await prisma.booking.findFirst({
        where: {
            id,
            OR: [{ clientId: userId }, { consultant: { userId } }],
        },
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found or you don't have permission");
    }

    // Only allow updates if booking is not completed or cancelled
    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
        throw new AppError(status.BAD_REQUEST, "Cannot update completed or cancelled bookings");
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: payload,
    });

    return updatedBooking as IBooking;
};

const cancelBooking = async (id: string, userId: string): Promise<IBooking | null> => {
    const booking = await prisma.booking.findFirst({
        where: {
            id,
            OR: [{ clientId: userId }, { consultant: { userId } }],
        },
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found or you don't have permission");
    }

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
        throw new AppError(status.BAD_REQUEST, "Booking is already completed or cancelled");
    }

    // Check cancellation policy (>24h = full refund, <24h = 50% refund)
    const now = new Date();
    const scheduledAt = new Date(booking.scheduledAt);
    const hoursUntilSession = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    const refundPercentage = hoursUntilSession >= 24 ? 100 : 50;

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
            status: BookingStatus.CANCELLED,
            paymentStatus: refundPercentage === 100 ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
        },
    });

    return updatedBooking as IBooking;
};

const confirmBooking = async (id: string, consultantUserId: string): Promise<IBooking | null> => {
    const booking = await prisma.booking.findFirst({
        where: {
            id,
            consultant: { userId: consultantUserId },
        },
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    if (booking.status !== BookingStatus.PENDING) {
        throw new AppError(status.BAD_REQUEST, "Only pending bookings can be confirmed");
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
            status: BookingStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID,
        },
    });

    return updatedBooking as IBooking;
};

const completeBooking = async (
    id: string,
    consultantUserId: string,
    postSessionNotes?: string
): Promise<IBooking | null> => {
    const booking = await prisma.booking.findFirst({
        where: {
            id,
            consultant: { userId: consultantUserId },
        },
    });

    if (!booking) {
        throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
        throw new AppError(status.BAD_REQUEST, "Only confirmed bookings can be completed");
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
            status: BookingStatus.COMPLETED,
            postSessionNotes,
        },
    });

    // Update consultant total sessions
    await prisma.consultant.update({
        where: { id: booking.consultantId },
        data: {
            totalSessions: { increment: 1 },
        },
    });

    return updatedBooking as IBooking;
};

export const BookingService = {
    createBooking,
    getMyBookings,
    getConsultantBookings,
    getBookingById,
    updateBooking,
    cancelBooking,
    confirmBooking,
    completeBooking,
};
