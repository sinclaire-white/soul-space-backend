
import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { CookieUtils } from "../../utils/cookie";
import { AuthService } from "./auth.service";
import { envVars } from "../../config/env";
import { tokenUtils } from "../../utils/token";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUser(req.body);
    tokenUtils.setAccessTokenCookie(res, result.token);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "User registered successfully",
        data: result,
    });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUser(req.body);
    tokenUtils.setAccessTokenCookie(res, result.token);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User logged in successfully",
        data: result,
    });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access. Please log in.");
    }
    const result = await AuthService.getMe(userId);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User profile retrieved successfully",
        data: result,
    });
});

const getNewToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken, sessionToken } = req.body;
    const result = await AuthService.getNewToken(refreshToken, sessionToken);
    tokenUtils.setAccessTokenCookie(res, result.token);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Token refreshed successfully",
        data: result,
    });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access. Please log in.");
    }
    const result = await AuthService.changePassword(userId, req.body);
    tokenUtils.setAccessTokenCookie(res, result.token);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Password changed successfully",
        data: result,
    });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
    const { sessionToken } = req.body;
    const result = await AuthService.logoutUser(sessionToken);
    res.clearCookie('accessToken', {
        path: '/',
        sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: envVars.NODE_ENV === 'production',
    });
    res.clearCookie('refreshToken', {
        path: '/',
        sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: envVars.NODE_ENV === 'production',
    });
    res.clearCookie('better-auth.session_token', {
        path: '/',
        sameSite: envVars.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: envVars.NODE_ENV === 'production',
    });

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await AuthService.verifyEmail(email, otp);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthService.forgetPassword(email);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    const result = await AuthService.resetPassword(email, otp, newPassword);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");

    if (!sessionToken) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access. Please log in.");
    }

    const result = await AuthService.googleLoginSuccess(sessionToken);
    tokenUtils.setAccessTokenCookie(res, result.token);
    tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Google login successful",
        data: result,
    });
});

export const AuthController = {
    registerUser,
    loginUser,
    getMe,
    getNewToken,
    changePassword,
    logoutUser,
    verifyEmail,
    forgetPassword,
    resetPassword,
    googleLoginSuccess,
};
