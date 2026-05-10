import { ZodError, ZodIssue } from "zod";
import { TErrorSources } from "../interfaces/error.interface";

export const handleZodError = (err: ZodError) => {
    const errorSources: TErrorSources[] = err.issues.map((issue: ZodIssue) => {
        const path = issue.path[issue.path.length - 1];

        return {
            path: typeof path === "string" || typeof path === "number" ? path : "",
            message: issue.message,
        };
    });

    const statusCode = 400;

    return {
        statusCode,
        message: 'Validation Error',
        errorSources,
    };
};
