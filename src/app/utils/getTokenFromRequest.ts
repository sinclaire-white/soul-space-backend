import { Request } from "express";

export const getTokenFromRequest = (
    req: Request, 
    cookieName: string, 
    headerName?: string
): string | undefined => {
    if (headerName) {
        const customHeader = req.headers[headerName.toLowerCase()];
        if (typeof customHeader === "string") {
            return customHeader;
        }
    }
    
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    
    return req.cookies?.[cookieName];
};