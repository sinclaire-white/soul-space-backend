import { BookingStatus, PaymentStatus } from "../../../../prisma/generated/prisma/enums";

export interface IBooking {
    id: string;
    clientId: string;
    consultantId: string;
    scheduledAt: Date;
    durationMinutes: number;
    status: BookingStatus;
    meetingLink?: string | null;
    preSessionNotes?: string | null;
    postSessionNotes?: string | null;
    pricePaid: number;
    paymentStatus: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBookingCreate {
    consultantId: string;
    scheduledAt: Date;
    durationMinutes?: number;
    preSessionNotes?: string;
}

export interface IBookingUpdate {
    scheduledAt?: Date;
    durationMinutes?: number;
    preSessionNotes?: string;
    status?: BookingStatus;
    postSessionNotes?: string;
}

export interface IBookingFilters {
    status?: BookingStatus;
    consultantId?: string;
    clientId?: string;
    fromDate?: Date;
    toDate?: Date;
}

export interface IBookingWithDetails extends IBooking {
    client?: {
        id: string;
        name?: string | null;
        nickname?: {
            handle: string;
        } | null;
    };
    consultant?: {
        id: string;
        user: {
            name?: string | null;
            nickname?: {
                handle: string;
            } | null;
        };
        professionalTitle: string;
        hourlyRate: number;
    };
}
