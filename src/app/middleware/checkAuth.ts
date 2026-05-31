/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { prisma } from "../lib/prisma";
import { jwtUtils } from "../utils/jwt";
import { getTokenFromRequest } from "../utils/getTokenFromRequest";

export const checkAuth = (...authRoles: UserRole[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionToken = getTokenFromRequest(req, "better-auth.session_token", "X-Session-Token");

        if (!sessionToken) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No session token provided.');
        }

        const sessionExists = await prisma.session.findFirst({
            where: {
                token: sessionToken,
                expiresAt: {
                    gt: new Date(),
                }
            },
            include: {
                user: true,
            }
        });

        if (!sessionExists || !sessionExists.user) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid session.');
        }

        const user = sessionExists.user;

        if (!user.isActive) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is not active.');
        }

        if (authRoles.length > 0 && !authRoles.includes(user.role as UserRole)) {
            throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission to access this resource.');
        }

        (req as any).user = {
            userId: user.id,
            role: user.role,
            email: user.email,
        };

        const userNickname = await prisma.nickname.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });
        if (userNickname) {
            (req as any).user.nicknameId = userNickname.id;
        }

        const accessToken = getTokenFromRequest(req, "accessToken");

        if (!accessToken) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access token provided.');
        }

        const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);

        if (!verifiedToken.success) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid access token.');
        }

        if (authRoles.length > 0 && !authRoles.includes(verifiedToken.data!.role as UserRole)) {
            throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission to access this resource.');
        }

        next();
    } catch (error: any) {
        next(error);
    }
};