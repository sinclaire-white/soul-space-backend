import status from "http-status";
import { ReportStatus, SuspensionType, UserRole } from "../../../../prisma/generated/prisma/enums";
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
            pricePaid: true,
        },
    });

    return stats.map((stat) => ({
        status: stat.status,
        count: typeof stat._count === "object" && "status" in stat._count ? stat._count.status ?? 0 : 0,
        revenue: Number(stat._sum?.pricePaid ?? 0),
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
            _count: {
                select: {
                    posts: true,
                    comments: true,
                    reportsMade: true,
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

const changeUserRole = async (userId: string, role: "USER" | "ADMIN", requesterId: string) => {
    const [target, requester] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.user.findUnique({ where: { id: requesterId } }),
    ]);

    if (!target) throw new AppError(status.NOT_FOUND, "User not found");

    if (target.role === UserRole.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Cannot change the role of a super admin");
    }

    if (requester?.role !== UserRole.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Only super admins can change user roles");
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
    });

    return updated;
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

    switch (action.action) {
        case "WARN":
            return user;
        case "SUSPEND":
            updateData = {
                isActive: false,
            };
            break;
        case "BAN":
            updateData = {
                isActive: false,
            };
            break;
        case "REINSTATE":
            updateData = {
                isActive: true,
            };
            break;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
        const nextUser = await tx.user.update({
            where: { id: userId },
            data: updateData,
        });

        if (action.action === "SUSPEND" || action.action === "BAN") {
            await tx.userSuspension.upsert({
                where: { userId },
                create: {
                    userId,
                    reason: action.reason,
                    suspensionType: action.action === "BAN" ? SuspensionType.PERMANENT : SuspensionType.TEMPORARY,
                    expiresAt: action.action === "SUSPEND" && action.duration
                        ? new Date(Date.now() + action.duration * 24 * 60 * 60 * 1000)
                        : null,
                },
                update: {
                    reason: action.reason,
                    suspensionType: action.action === "BAN" ? SuspensionType.PERMANENT : SuspensionType.TEMPORARY,
                    expiresAt: action.action === "SUSPEND" && action.duration
                        ? new Date(Date.now() + action.duration * 24 * 60 * 60 * 1000)
                        : null,
                },
            });
        }

        if (action.action === "REINSTATE") {
            await tx.userSuspension.deleteMany({ where: { userId } });
        }

        return nextUser;
    });

    return updatedUser;
};

const getAllConsultants = async (query: any) => {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [consultants, total] = await Promise.all([
        prisma.consultant.findMany({
            skip,
            take: Number(limit),
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
        prisma.consultant.count(),
    ]);

    return {
        data: consultants,
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

const getAllPosts = async (query: any) => {
    const { page = 1, limit = 10, search, status, isHidden } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
        where.OR = [
            { content: { contains: search, mode: "insensitive" } },
        ];
    }

    if (status) {
        where.status = status;
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
        prisma.userSuspension.findMany({
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
        prisma.userSuspension.count({ where }),
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

const getDailyStats = async (days = 30): Promise<{ date: string; newUsers: number; newPosts: number }[]> => {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days + 1);
    since.setUTCHours(0, 0, 0, 0);

    const [users, posts] = await Promise.all([
        prisma.user.findMany({
            where: { createdAt: { gte: since } },
            select: { createdAt: true },
        }),
        prisma.post.findMany({
            where: { createdAt: { gte: since } },
            select: { createdAt: true },
        }),
    ]);

    const result: { date: string; newUsers: number; newPosts: number }[] = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setUTCDate(since.getUTCDate() + i);
        const key = d.toISOString().slice(0, 10);
        result.push({
            date: key,
            newUsers: users.filter((u) => u.createdAt.toISOString().slice(0, 10) === key).length,
            newPosts: posts.filter((p) => p.createdAt.toISOString().slice(0, 10) === key).length,
        });
    }
    return result;
};

export const AdminService = {
    getDashboardStats,
    getUserStats,
    getPostStats,
    getBookingStats,
    getReportStats,
    getDailyStats,
    getAllUsers,
    getUserById,
    updateUser,
    changeUserRole,
    moderateUser,
    getAllConsultants,
    getAllPosts,
    updatePost,
    deletePost,
    getModerationLogs,
};
