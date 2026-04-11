import { ReportType, ReportStatus } from "../../../../prisma/generated/prisma/enums";

export interface IReport {
    id: string;
    reporterId: string;
    postId?: string | null;
    commentId?: string | null;
    reportType: ReportType;
    status: ReportStatus;
    notes?: string | null;
    resolvedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IReportCreate {
    postId?: string;
    commentId?: string;
    reportType: ReportType;
    notes?: string;
}

export interface IReportUpdate {
    status?: ReportStatus;
    notes?: string;
}

export interface IReportFilters {
    status?: ReportStatus;
    reportType?: ReportType;
}

export interface IReportWithDetails extends IReport {
    reporter: {
        id: string;
        nickname?: {
            handle: string;
        } | null;
    };
    post?: {
        id: string;
        content: string;
        authorId: string;
    } | null;
    comment?: {
        id: string;
        content: string;
        authorId: string;
    } | null;
}
