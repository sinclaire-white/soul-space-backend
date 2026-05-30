import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { BookingService } from "./booking.service";
import { IBookingFilters } from "./booking.interface";
import { BookingStatus } from "../../../../prisma/generated/prisma/enums";

const createBooking = catchAsync(async (req: Request, res: Response) => {
    const clientId = (req as any).user?.userId;
    const result = await BookingService.createBooking(clientId, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Booking created successfully",
        data: result,
    });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    const clientId = (req as any).user?.userId;
    const filters: IBookingFilters = {
        status: req.query.status as BookingStatus | undefined,
        consultantId: req.query.consultantId as string | undefined,
        clientId: req.query.clientId as string | undefined,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await BookingService.getMyBookings(clientId, filters, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Bookings retrieved successfully",
        data: result.bookings,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getConsultantBookings = catchAsync(async (req: Request, res: Response) => {
    const consultantUserId = (req as any).user?.userId;
    const filters: IBookingFilters = {
        status: req.query.status as BookingStatus | undefined,
        consultantId: req.query.consultantId as string | undefined,
        clientId: req.query.clientId as string | undefined,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
    };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get consultant ID from user ID
    const { prisma } = await import("../../lib/prisma");
    const consultant = await prisma.consultant.findUnique({
        where: { userId: consultantUserId },
    });

    if (!consultant) {
        return sendResponse(res, {
            httpStatusCode: status.NOT_FOUND,
            success: false,
            message: "Consultant profile not found",
        });
    }

    const result = await BookingService.getConsultantBookings(consultant.id, filters, page, limit);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Bookings retrieved successfully",
        data: result.bookings,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await BookingService.getBookingById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Booking retrieved successfully",
        data: result,
    });
});

const updateBooking = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user?.userId;
    const result = await BookingService.updateBooking(id, userId, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Booking updated successfully",
        data: result,
    });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user?.userId;
    const result = await BookingService.cancelBooking(id, userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Booking cancelled successfully",
        data: result,
    });
});

const confirmBooking = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const consultantUserId = (req as any).user?.userId;
    const result = await BookingService.confirmBooking(id, consultantUserId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Booking confirmed successfully",
        data: result,
    });
});

const completeBooking = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const consultantUserId = (req as any).user?.userId;
    const { postSessionNotes } = req.body;
    const result = await BookingService.completeBooking(id, consultantUserId, postSessionNotes);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Booking completed successfully",
        data: result,
    });
});

const declineBooking = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const consultantUserId = (req as any).user?.userId;
    const result = await BookingService.declineBooking(id, consultantUserId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Booking declined successfully",
        data: result,
    });
});

export const BookingController = {
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
