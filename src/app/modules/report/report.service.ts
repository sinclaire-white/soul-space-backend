import { ReportStatus, ReportType, PostStatus, CommentStatus } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IReport, IReportCreate, IReportFilters, IReportUpdate, IReportWithDetails } from "./report.interface";

const createReport = async (
    reporterId: string,
    payload: IReportCreate
): Promise<IReport> => {
    // Validate that either postId or commentId is provided
    if (!payload.postId && !payload.commentId) {
        throw new AppError(status.BAD_REQUEST, "Either postId or commentId must be provided");
    }

    // Check if post exists if provided
    if (payload.postId) {
        const post = await prisma.post.findUnique({
            where: { id: payload.postId },
        });
        if (!post) {
            throw new AppError(status.NOT_FOUND, "Post not found");
        }
        // Check if user is reporting their own post
        if (post.authorId === reporterId) {
            throw new AppError(status.BAD_REQUEST, "You cannot report your own post");
        }
    }

    // Check if comment exists if provided
    if (payload.commentId) {
        const comment = await prisma.comment.findUnique({
            where: { id: payload.commentId },
        });
        if (!comment) {
            throw new AppError(status.NOT_FOUND, "Comment not found");
        }
        // Check if user is reporting their own comment
        if (comment.authorId === reporterId) {
            throw new AppError(status.BAD_REQUEST, "You cannot report your own comment");
        }
    }

    // Check if user already reported this content
    const existingReport = await prisma.report.findFirst({
        where: {
            reporterId,
            postId: payload.postId || null,
            commentId: payload.commentId || null,
        },
    });

    if (existingReport) {
        throw new AppError(status.CONFLICT, "You have already reported this content");
    }

    const report = await prisma.report.create({
        data: {
            reporterId,
            postId: payload.postId || null,
            commentId: payload.commentId || null,
            reportType: payload.reportType,
            notes: payload.notes,
            status: ReportStatus.OPEN,
        },
    });

    // If self-harm report, escalate immediately
    if (payload.reportType === ReportType.SELF_HARM) {
        await prisma.report.update({
            where: { id: report.id },
            data: { status: ReportStatus.ESCALATED },
        });
        // TODO: Send notification to admin
    }

    return report as IReport;
};

const getAllReports = async (
    filters: IReportFilters,
    page: number = 1,
    limit: number = 20
): Promise<{ reports: IReportWithDetails[]; total: number }> => {
    const where: any = {};

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.reportType) {
        where.reportType = filters.reportType;
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
        prisma.report.findMany({
            where,
            skip,
            take: limit,
            orderBy: [
                { reportType: "asc" }, // SELF_HARM first
                { createdAt: "desc" },
            ],
            include: {
                reporter: {
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
        prisma.report.count({ where }),
    ]);

    return { reports: reports as IReportWithDetails[], total };
};

const getReportById = async (id: string): Promise<IReportWithDetails | null> => {
    const report = await prisma.report.findUnique({
        where: { id },
        include: {
            reporter: {
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
    });

    return report as IReportWithDetails | null;
};

const updateReport = async (
    id: string,
    payload: IReportUpdate
): Promise<IReport | null> => {
    const report = await prisma.report.update({
        where: { id },
        data: {
            ...payload,
            resolvedAt: payload.status === ReportStatus.REVIEWED || payload.status === ReportStatus.DISMISSED
                ? new Date()
                : undefined,
        },
    });

    return report as IReport;
};

const hideContent = async (id: string): Promise<void> => {
    const report = await prisma.report.findUnique({
        where: { id },
    });

    if (!report) {
        throw new AppError(status.NOT_FOUND, "Report not found");
    }

    // Hide post
    if (report.postId) {
        await prisma.post.update({
            where: { id: report.postId },
            data: { status: PostStatus.UNDER_REVIEW },
        });
    }

    // Hide comment
    if (report.commentId) {
        await prisma.comment.update({
            where: { id: report.commentId },
            data: { status: CommentStatus.FLAGGED },
        });
    }

    // Update report status
    await prisma.report.update({
        where: { id },
        data: {
            status: ReportStatus.REVIEWED,
            resolvedAt: new Date(),
        },
    });
};

const removeContent = async (id: string): Promise<void> => {
    const report = await prisma.report.findUnique({
        where: { id },
    });

    if (!report) {
        throw new AppError(status.NOT_FOUND, "Report not found");
    }

    // Remove post
    if (report.postId) {
        await prisma.post.update({
            where: { id: report.postId },
            data: { status: PostStatus.REMOVED },
        });
    }

    // Remove comment
    if (report.commentId) {
        await prisma.comment.update({
            where: { id: report.commentId },
            data: { status: CommentStatus.REMOVED },
        });
    }

    // Update report status
    await prisma.report.update({
        where: { id },
        data: {
            status: ReportStatus.REVIEWED,
            resolvedAt: new Date(),
        },
    });
};

const getMyReports = async (
    reporterId: string,
    page: number = 1,
    limit: number = 20
): Promise<{ reports: IReport[]; total: number }> => {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
        prisma.report.findMany({
            where: { reporterId },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.report.count({ where: { reporterId } }),
    ]);

    return { reports: reports as IReport[], total };
};

const getReportStats = async (): Promise<{
    totalReports: number;
    openReports: number;
    escalatedReports: number;
    byType: Record<ReportType, number>;
}> => {
    const [
        totalReports,
        openReports,
        escalatedReports,
        reportsByType,
    ] = await Promise.all([
        prisma.report.count(),
        prisma.report.count({ where: { status: ReportStatus.OPEN } }),
        prisma.report.count({ where: { status: ReportStatus.ESCALATED } }),
        prisma.report.groupBy({
            by: ["reportType"],
            _count: { reportType: true },
        }),
    ]);

    const byType = {} as Record<ReportType, number>;
    reportsByType.forEach((item) => {
        byType[item.reportType] = item._count.reportType;
    });

    return {
        totalReports,
        openReports,
        escalatedReports,
        byType,
    };
};

export const ReportService = {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    hideContent,
    removeContent,
    getMyReports,
    getReportStats,
};
