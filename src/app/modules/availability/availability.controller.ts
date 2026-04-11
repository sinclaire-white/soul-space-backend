import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AvailabilityService } from "./availability.service";

const createAvailability = catchAsync(async (req: Request, res: Response) => {
    const consultantUserId = (req as any).user?.userId;
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

    const result = await AvailabilityService.createAvailability(consultant.id, req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Availability created successfully",
        data: result,
    });
});

const getMyAvailabilities = catchAsync(async (req: Request, res: Response) => {
    const consultantUserId = (req as any).user?.userId;
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

    const result = await AvailabilityService.getAvailabilitiesByConsultant(consultant.id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Availabilities retrieved successfully",
        data: result,
    });
});

const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
    const { consultantId } = req.params;
    const fromDate = req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : new Date();
    const days = parseInt(req.query.days as string) || 14;

    const result = await AvailabilityService.getAvailableSlots(consultantId, fromDate, days);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Available slots retrieved successfully",
        data: result,
    });
});

const updateAvailability = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const consultantUserId = (req as any).user?.userId;
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

    const result = await AvailabilityService.updateAvailability(id, consultant.id, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Availability updated successfully",
        data: result,
    });
});

const deleteAvailability = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const consultantUserId = (req as any).user?.userId;
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

    await AvailabilityService.deleteAvailability(id, consultant.id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Availability deleted successfully",
        data: null,
    });
});

const blockTimeSlot = catchAsync(async (req: Request, res: Response) => {
    const consultantUserId = (req as any).user?.userId;
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

    const { date, startTime, endTime } = req.body;
    const result = await AvailabilityService.blockTimeSlot(
        consultant.id,
        new Date(date),
        new Date(startTime),
        new Date(endTime)
    );

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Time slot blocked successfully",
        data: result,
    });
});

export const AvailabilityController = {
    createAvailability,
    getMyAvailabilities,
    getAvailableSlots,
    updateAvailability,
    deleteAvailability,
    blockTimeSlot,
};
