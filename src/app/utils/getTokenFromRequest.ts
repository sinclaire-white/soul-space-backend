import { Request } from "express";

export const getTokenFromRequest = (req: Request, cookieName: string): string | undefined => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    return req.cookies?.[cookieName];
};