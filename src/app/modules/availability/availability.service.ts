import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IAvailability, IAvailabilityCreate, IAvailabilityUpdate, ITimeSlot, IDaySchedule } from "./availability.interface";
import { addDays } from "date-fns";

const createAvailability = async (
    consultantId: string,
    payload: IAvailabilityCreate
): Promise<IAvailability> => {
    const existingSlots = await prisma.consultantAvailability.findMany({
        where: {
            consultantId,
            dayOfWeek: payload.dayOfWeek,
            isBlocked: false,
        },
    });

    const newStart = new Date(payload.startTime);
    const newEnd = new Date(payload.endTime);

    for (const slot of existingSlots) {
        const existingStart = new Date(slot.startTime);
        const existingEnd = new Date(slot.endTime);

        if (
            (newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
        ) {
            throw new AppError(status.CONFLICT, "Time slot overlaps with existing availability");
        }
    }

    const availability = await prisma.consultantAvailability.create({
        data: {
            consultantId,
            dayOfWeek: payload.dayOfWeek,
            startTime: newStart,
            endTime: newEnd,
            isRecurring: payload.isRecurring ?? true,
            isBlocked: payload.isBlocked ?? false,
        },
    });

    return availability as IAvailability;
};

const getAvailabilitiesByConsultant = async (
    consultantId: string
): Promise<IAvailability[]> => {
    const availabilities = await prisma.consultantAvailability.findMany({
        where: {
            consultantId,
            isBlocked: false,
        },
        orderBy: [
            { dayOfWeek: "asc" },
            { startTime: "asc" },
        ],
    });

    return availabilities as IAvailability[];
};

const getAvailableSlots = async (
    consultantId: string,
    fromDate: Date = new Date(),
    days: number = 14
): Promise<IDaySchedule[]> => {
    const availabilities = await prisma.consultantAvailability.findMany({
        where: {
            consultantId,
            isBlocked: false,
        },
        select: { dayOfWeek: true },
    });

    const availableDays = new Set(availabilities.map((a) => a.dayOfWeek));

    const endDate = addDays(fromDate, days);
    const bookings = await prisma.booking.findMany({
        where: {
            consultantId,
            scheduledAt: {
                gte: fromDate,
                lte: endDate,
            },
            status: {
                notIn: ["CANCELLED", "NO_SHOW"],
            },
        },
    });

    const schedules: IDaySchedule[] = [];

    for (let i = 0; i < days; i++) {
        const currentDate = addDays(fromDate, i);
        const dayOfWeek = currentDate.getUTCDay();

        if (!availableDays.has(dayOfWeek)) {
            continue;
        }

        const slots: ITimeSlot[] = [];

        for (let hour = 10; hour < 22; hour++) {
            const slotStart = new Date(Date.UTC(
                currentDate.getUTCFullYear(),
                currentDate.getUTCMonth(),
                currentDate.getUTCDate(),
                hour, 0, 0
            ));

            const slotEnd = new Date(Date.UTC(
                currentDate.getUTCFullYear(),
                currentDate.getUTCMonth(),
                currentDate.getUTCDate(),
                hour + 1, 0, 0
            ));

            const isBooked = bookings.some((booking) => {
                const bookingStart = new Date(booking.scheduledAt).getTime();
                const bookingEnd = bookingStart + booking.durationMinutes * 60000;
                return slotStart.getTime() < bookingEnd && slotEnd.getTime() > bookingStart;
            });

            slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                isAvailable: !isBooked,
            });
        }

        if (slots.length > 0) {
            schedules.push({
                dayOfWeek,
                date: currentDate,
                slots,
            });
        }
    }

    return schedules;
};

const updateAvailability = async (
    id: string,
    consultantId: string,
    payload: IAvailabilityUpdate
): Promise<IAvailability | null> => {
    const existing = await prisma.consultantAvailability.findFirst({
        where: { id, consultantId },
    });

    if (!existing) {
        throw new AppError(status.NOT_FOUND, "Availability not found");
    }

    const availability = await prisma.consultantAvailability.update({
        where: { id },
        data: payload,
    });

    return availability as IAvailability;
};

const deleteAvailability = async (
    id: string,
    consultantId: string
): Promise<void> => {
    const existing = await prisma.consultantAvailability.findFirst({
        where: { id, consultantId },
    });

    if (!existing) {
        throw new AppError(status.NOT_FOUND, "Availability not found");
    }

    await prisma.consultantAvailability.delete({
        where: { id },
    });
};

const blockTimeSlot = async (
    consultantId: string,
    date: Date,
    startTime: Date,
    endTime: Date
): Promise<IAvailability> => {
    const dayOfWeek = date.getDay();

    const availability = await prisma.consultantAvailability.create({
        data: {
            consultantId,
            dayOfWeek,
            startTime,
            endTime,
            isRecurring: false,
            isBlocked: true,
        },
    });

    return availability as IAvailability;
};

export const AvailabilityService = {
    createAvailability,
    getAvailabilitiesByConsultant,
    getAvailableSlots,
    updateAvailability,
    deleteAvailability,
    blockTimeSlot,
};