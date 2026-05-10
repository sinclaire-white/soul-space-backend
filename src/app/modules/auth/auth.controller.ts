
import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { AuthService } from "./auth.service";
import { tokenUtils } from "../../utils/token";
import { envVars } from "../../config/env";

const setAuthCookies = (res: Response, token: string, refreshToken: string, sessionToken: string | null) => {
    tokenUtils.setAccessTokenCookie(res, token);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);

    if (sessionToken) {
        tokenUtils.setBetterAuthSessionCookie(res, sessionToken);
    }
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUser(req.body);
    setAuthCookies(res, result.token, result.refreshToken, result.sessionToken);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "User registered successfully",
        data: result,
    });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUser(req.body);
    setAuthCookies(res, result.token, result.refreshToken, result.sessionToken);

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
    setAuthCookies(res, result.token, result.refreshToken, result.sessionToken);

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
    setAuthCookies(res, result.token, result.refreshToken, result.sessionToken);

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

const resendOTP = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthService.resendVerificationOTP(email);
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

export const AuthController = {
    registerUser,
    loginUser,
    getMe,
    getNewToken,
    changePassword,
    logoutUser,
    verifyEmail,
    resendOTP,
    forgetPassword,
    resetPassword,
};
