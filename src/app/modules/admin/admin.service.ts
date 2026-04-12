import status from "http-status";
import { ReportStatus, UserRole } from "../../../../prisma/generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import {
    IAdminUpdatePostPayload,
    IAdminUpdateUserPayload,
    IBookingStats,
    IDashboardStats,
    IModerationAction,
    IPostStats,
    IReportStats,
    IUserStats,
} from "./admin.interface";

const getDashboardStats = async (): Promise<IDashboardStats> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        totalUsers,
        totalPosts,
        totalComments,
        totalConsultants,
        totalBookings,
        totalReports,
        pendingReports,
        usersThisMonth,
        postsThisMonth,
        bookingsThisMonth,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.comment.count(),
        prisma.consultant.count(),
        prisma.booking.count(),
        prisma.report.count(),
        prisma.report.count({ where: { status: ReportStatus.OPEN } }),
        prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.post.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    return {
        totalUsers,
        totalPosts,
        totalComments,
        totalConsultants,
        totalBookings,
        totalReports,
        pendingReports,
        usersThisMonth,
        postsThisMonth,
        bookingsThisMonth,
    };
};

const getUserStats = async (): Promise<IUserStats[]> => {
    const stats = await prisma.user.groupBy({
        by: ["role"],
        _count: {
            role: true,
        },
    });

    return stats.map((stat) => ({
        role: stat.role,
        count: stat._count.role,
    }));
};

const getPostStats = async (): Promise<IPostStats[]> => {
    const stats = await prisma.post.groupBy({
        by: ["status"],
        _count: {
            status: true,
        },
    });

    return stats.map((stat) => ({
        status: stat.status,
        count: stat._count.status,
    }));
};

const getBookingStats = async (): Promise<IBookingStats[]> => {
    const stats = await prisma.booking.groupBy({
        by: ["status"],
        _count: {
            status: true,
        },
        _sum: {
            amount: true,
        },
    });

    return stats.map((stat) => ({
        status: stat.status,
        count: stat._count.status,
        revenue: stat._sum.amount || 0,
    }));
};

const getReportStats = async (): Promise<IReportStats[]> => {
    const stats = await prisma.report.groupBy({
        by: ["status"],
        _count: {
            status: true,
        },
    });

    return stats.map((stat) => ({
        status: stat.status,
        count: stat._count.status,
    }));
};

const getAllUsers = async (query: any) => {
    const { page = 1, limit = 10, search, role, isActive } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    if (role) {
        where.role = role;
    }

    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: "desc" },
            include: {
                nickname: true,
                consultant: true,
                _count: {
                    select: {
                        posts: true,
                        comments: true,
                    },
                },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        data: users,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

const getUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            nickname: true,
            consultant: true,
            posts: {
                take: 5,
                orderBy: { createdAt: "desc" },
            },
            comments: {
                take: 5,
                orderBy: { createdAt: "desc" },
            },
            reportsMade: {
                take: 5,
                orderBy: { createdAt: "desc" },
            },
            reportsReceived: {
                take: 5,
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: {
                    posts: true,
                    comments: true,
                    reportsMade: true,
                    reportsReceived: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    return user;
};

const updateUser = async (userId: string, payload: IAdminUpdateUserPayload) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    // Prevent modifying super admin
    if (user.role === UserRole.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Cannot modify super admin");
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: payload,
    });

    return updatedUser;
};

const moderateUser = async (userId: string, action: IModerationAction) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    // Prevent moderating super admin
    if (user.role === UserRole.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Cannot moderate super admin");
    }

    let updateData: any = {};
    let moderationLog: any = {
        userId,
        action: action.action,
        reason: action.reason,
    };

    switch (action.action) {
        case "WARN":
            // Just log the warning
            break;
        case "SUSPEND":
            updateData = {
                isActive: false,
                suspendedUntil: action.duration
                    ? new Date(Date.now() + action.duration * 24 * 60 * 60 * 1000)
                    : null,
            };
            break;
        case "BAN":
            updateData = {
                isActive: false,
                bannedAt: new Date(),
            };
            break;
        case "REINSTATE":
            updateData = {
                isActive: true,
                suspendedUntil: null,
                bannedAt: null,
            };
            break;
    }

    const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: updateData,
        }),
        prisma.moderationLog.create({
            data: moderationLog,
        }),
    ]);

    return updatedUser;
};

const getAllPosts = async (query: any) => {
    const { page = 1, limit = 10, search, status, isHidden } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
        ];
    }

    if (status) {
        where.status = status;
    }

    if (isHidden !== undefined) {
        where.isHidden = isHidden === "true";
    }

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    include: {
                        nickname: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        reactions: true,
                    },
                },
            },
        }),
        prisma.post.count({ where }),
    ]);

    return {
        data: posts,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

const updatePost = async (postId: string, payload: IAdminUpdatePostPayload) => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new AppError(status.NOT_FOUND, "Post not found");
    }

    const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: payload,
    });

    return updatedPost;
};

const deletePost = async (postId: string) => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new AppError(status.NOT_FOUND, "Post not found");
    }

    await prisma.post.delete({
        where: { id: postId },
    });

    return { message: "Post deleted successfully" };
};

const getModerationLogs = async (query: any) => {
    const { page = 1, limit = 10, userId } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (userId) {
        where.userId = userId;
    }

    const [logs, total] = await Promise.all([
        prisma.moderationLog.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        }),
        prisma.moderationLog.count({ where }),
    ]);

    return {
        data: logs,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

export const AdminService = {
    getDashboardStats,
    getUserStats,
    getPostStats,
    getBookingStats,
    getReportStats,
    getAllUsers,
    getUserById,
    updateUser,
    moderateUser,
    getAllPosts,
    updatePost,
    deletePost,
    getModerationLogs,
};
