import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IAvailability, IAvailabilityCreate, IAvailabilityUpdate, ITimeSlot, IDaySchedule } from "./availability.interface";
import { addDays, startOfDay, format, parseISO } from "date-fns";

const BUFFER_MINUTES = 15;

const createAvailability = async (
    consultantId: string,
    payload: IAvailabilityCreate
): Promise<IAvailability> => {
    // Check for overlapping slots
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
    // Get consultant's availabilities
    const availabilities = await prisma.consultantAvailability.findMany({
        where: {
            consultantId,
            isBlocked: false,
        },
    });

    // Get existing bookings
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
        const dayOfWeek = currentDate.getDay();

        // Find availabilities for this day
        const dayAvailabilities = availabilities.filter(
            (a) => a.dayOfWeek === dayOfWeek
        );

        if (dayAvailabilities.length === 0) {
            continue;
        }

        const slots: ITimeSlot[] = [];

        for (const availability of dayAvailabilities) {
            const availStart = new Date(availability.startTime);
            const availEnd = new Date(availability.endTime);

            // Create slots (60 min each + 15 min buffer)
            const slotDuration = 60;
            const buffer = BUFFER_MINUTES;
            const totalSlotTime = slotDuration + buffer;

            let slotStart = new Date(availStart);

            while (slotStart.getTime() + slotDuration * 60000 <= availEnd.getTime()) {
                const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

                // Check if slot overlaps with any booking
                const isBooked = bookings.some((booking) => {
                    const bookingStart = new Date(booking.scheduledAt);
                    const bookingEnd = new Date(
                        bookingStart.getTime() + booking.durationMinutes * 60000
                    );
                    return slotStart < bookingEnd && slotEnd > bookingStart;
                });

                slots.push({
                    startTime: new Date(currentDate.setHours(
                        slotStart.getHours(),
                        slotStart.getMinutes()
                    )),
                    endTime: new Date(currentDate.setHours(
                        slotEnd.getHours(),
                        slotEnd.getMinutes()
                    )),
                    isAvailable: !isBooked,
                });

                // Move to next slot
                slotStart = new Date(slotStart.getTime() + totalSlotTime * 60000);
            }
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
    // Check if availability belongs to consultant
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
