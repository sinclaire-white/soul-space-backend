import { BookingStatus, PaymentStatus } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IBooking, IBookingCreate, IBookingFilters, IBookingUpdate, IBookingWithDetails } from "./booking.interface";

const MIN_ADVANCE_HOURS = 24;
const MAX_ADVANCE_DAYS = 28;

const toNumber = (value: number | { toNumber(): number }) =>
    typeof value === "number" ? value : value.toNumber();

const mapBooking = (booking: any): IBooking => {
    const { pricePaid, ...rest } = booking;

    return {
        ...rest,
        pricePaid: toNumber(pricePaid),
    };
};

const mapBookingWithDetails = (booking: any): IBookingWithDetails => ({
    ...mapBooking(booking),
    client: booking.client,
    consultant: booking.consultant
        ? {
            ...booking.consultant,
            hourlyRate: toNumber(booking.consultant.hourlyRate),
        }
        : undefined,
});

const createBooking = async (
    clientId: string,
    payload: IBookingCreate
): Promise<IBooking> => {
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

    if (consultant.userId === clientId) {
        throw new AppError(status.BAD_REQUEST, "You cannot book yourself");
    }

    const scheduledAt = new Date(payload.scheduledAt);
    const now = new Date();

    const availabilities = await prisma.consultantAvailability.findMany({
        where: {
            consultantId: payload.consultantId,
            isBlocked: false,
        },
        select: { dayOfWeek: true },
    });

    const duration = payload.durationMinutes || 60;
    if (duration < 30) {
        throw new AppError(status.BAD_REQUEST, "Minimum session duration is 30 minutes");
    }
    if (duration > 480) {
        throw new AppError(status.BAD_REQUEST, "Maximum session duration is 8 hours");
    }

    const requestedDay = scheduledAt.getUTCDay();
    const isAvailableDay = availabilities.some((a) => a.dayOfWeek === requestedDay);

    if (!isAvailableDay) {
        throw new AppError(status.BAD_REQUEST, "Consultant is not available on this day of the week");
    }

    if (scheduledAt.getUTCMinutes() !== 0) {
        throw new AppError(status.BAD_REQUEST, "Sessions must start on the hour (e.g. 10:00, 11:00)");
    }

    const requestedMinutes = scheduledAt.getUTCHours() * 60 + scheduledAt.getUTCMinutes();
    const sessionEndMinutes = requestedMinutes + duration;

    if (requestedMinutes < 600 || sessionEndMinutes > 1320) {
        throw new AppError(
            status.BAD_REQUEST,
            "Selected time is outside the consultant's availability window (10:00 - 22:00 UTC)"
        );
    }

    const hoursUntilSession = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilSession < MIN_ADVANCE_HOURS) {
        throw new AppError(
            status.BAD_REQUEST,
            `Bookings must be made at least ${MIN_ADVANCE_HOURS} hours in advance`
        );
    }

    const daysUntilSession = hoursUntilSession / 24;
    if (daysUntilSession > MAX_ADVANCE_DAYS) {
        throw new AppError(
            status.BAD_REQUEST,
            `Bookings cannot be made more than ${MAX_ADVANCE_DAYS} days in advance`
        );
    }

    const sessionStart = scheduledAt.getTime();
    const sessionEnd = sessionStart + duration * 60000;

    const dayStart = new Date(Date.UTC(
        scheduledAt.getUTCFullYear(),
        scheduledAt.getUTCMonth(),
        scheduledAt.getUTCDate(),
        0, 0, 0
    ));
    const dayAfter = new Date(Date.UTC(
        scheduledAt.getUTCFullYear(),
        scheduledAt.getUTCMonth(),
        scheduledAt.getUTCDate() + 1,
        0, 0, 0
    ));

    const bookingsOnDay = await prisma.booking.findMany({
        where: {
            consultantId: payload.consultantId,
            status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
            scheduledAt: {
                gte: dayStart,
                lt: dayAfter,
            },
        },
    });

    const hasConflict = bookingsOnDay.some((booking) => {
        const bookingStart = new Date(booking.scheduledAt).getTime();
        const bookingEnd = bookingStart + booking.durationMinutes * 60000;
        return sessionStart < bookingEnd && sessionEnd > bookingStart;
    });

    if (hasConflict) {
        throw new AppError(status.CONFLICT, "This time slot is already booked");
    }

    const booking = await prisma.booking.create({
        data: {
            clientId,
            consultantId: payload.consultantId,
            scheduledAt,
            durationMinutes: duration,
            preSessionNotes: payload.preSessionNotes,
            pricePaid: consultant.hourlyRate.toNumber(),
            paymentStatus: PaymentStatus.PENDING,
            status: BookingStatus.PENDING,
        },
    });

    return mapBooking(booking);
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

    return { bookings: bookings.map(mapBookingWithDetails), total };
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

    return { bookings: bookings.map(mapBookingWithDetails), total };
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

    return booking ? mapBookingWithDetails(booking) : null;
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

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
        throw new AppError(status.BAD_REQUEST, "Cannot update completed or cancelled bookings");
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: payload,
    });

    return mapBooking(updatedBooking);
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

    return mapBooking(updatedBooking);
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

    return mapBooking(updatedBooking);
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

    await prisma.consultant.update({
        where: { id: booking.consultantId },
        data: {
            totalSessions: { increment: 1 },
        },
    });

    return mapBooking(updatedBooking);
};

const declineBooking = async (id: string, consultantUserId: string): Promise<IBooking | null> => {
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
        throw new AppError(status.BAD_REQUEST, "Only pending bookings can be declined");
    }

    const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
            status: BookingStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED,
        },
    });

    return mapBooking(updatedBooking);
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
    declineBooking,
};