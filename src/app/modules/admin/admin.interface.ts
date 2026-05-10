export interface IDashboardStats {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    totalConsultants: number;
    totalBookings: number;
    totalReports: number;
    pendingReports: number;
    usersThisMonth: number;
    postsThisMonth: number;
    bookingsThisMonth: number;
}

export interface IUserStats {
    role: string;
    count: number;
}

export interface IPostStats {
    status: string;
    count: number;
}

export interface IBookingStats {
    status: string;
    count: number;
    revenue: number;
}

export interface IReportStats {
    status: string;
    count: number;
}

export interface IModerationAction {
    action: "WARN" | "SUSPEND" | "BAN" | "REINSTATE";
    reason: string;
    duration?: number; // in days for suspension
}

export interface IAdminUpdateUserPayload {
    role?: "USER" | "CONSULTANT" | "ADMIN" | "SUPER_ADMIN";
    isActive?: boolean;
    emailVerified?: boolean;
}

export interface IAdminUpdatePostPayload {
    status?: "ACTIVE" | "HIDDEN_BY_USER" | "UNDER_REVIEW" | "REMOVED";
}
