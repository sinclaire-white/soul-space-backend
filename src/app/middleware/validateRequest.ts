import { NextFunction, Request, Response } from "express";
import z from "zod";

type ValidatedRequestShape = {
    body?: Request["body"];
    query?: Request["query"];
    params?: Request["params"];
};

export const validateRequest = (zodSchema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        void res;

        try {
            const requestBody = typeof req.body?.data === "string"
                ? JSON.parse(req.body.data)
                : req.body;

            const directParseResult = zodSchema.safeParse(requestBody);

            if (directParseResult.success) {
                req.body = directParseResult.data;
                return next();
            }

            const wrappedParseResult = zodSchema.safeParse({
                body: requestBody,
                query: req.query,
                params: req.params,
            });

            if (!wrappedParseResult.success) {
                return next(wrappedParseResult.error);
            }

            const validatedRequest = wrappedParseResult.data as ValidatedRequestShape;

            if (validatedRequest.body !== undefined) {
                req.body = validatedRequest.body;
            }

            if (validatedRequest.query !== undefined) {
                req.query = validatedRequest.query;
            }

            if (validatedRequest.params !== undefined) {
                req.params = validatedRequest.params;
            }

            return next();
        } catch (error) {
            return next(error);
        }
    }
}
