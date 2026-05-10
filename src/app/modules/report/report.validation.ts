import { z } from "zod";
import { ReportType, ReportStatus } from "../../../../prisma/generated/prisma/enums";

const createReportSchema = z.object({
    postId: z.string().optional(),
    commentId: z.string().optional(),
    reportType: z.nativeEnum(ReportType),
    notes: z.string().max(1000, "Notes must be at most 1000 characters").optional(),
}).refine((data) => data.postId || data.commentId, {
    message: "Either postId or commentId must be provided",
    path: ["postId"],
});

const updateReportSchema = z.object({
    status: z.nativeEnum(ReportStatus).optional(),
    notes: z.string().max(1000).optional(),
});

const reportFiltersSchema = z.object({
    status: z.nativeEnum(ReportStatus).optional(),
    reportType: z.nativeEnum(ReportType).optional(),
});

export const ReportValidation = {
    createReportSchema,
    updateReportSchema,
    reportFiltersSchema,
};
