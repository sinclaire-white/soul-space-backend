import status from "http-status";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import { tokenUtils } from "../../utils/token";
import { IAuthResponse, IChangePasswordPayload, ILoginUserPayload, IRegisterUserPayload } from "./auth.interface";

const registerUser = async (payload: IRegisterUserPayload): Promise<IAuthResponse> => {
    const { name, email, password } = payload;

    const data = await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
        },
    });

    if (!data.user) {
        throw new AppError(status.BAD_REQUEST, "Failed to register user");
    }

    // Create nickname for user
    const handle = `user_${Math.random().toString(36).substring(2, 8)}`;
    await prisma.nickname.create({
        data: {
            userId: data.user.id,
            handle,
            isActive: true,
        },
    });

    const accessToken = tokenUtils.getAccessToken({
        userId: data.user.id,
        role: data.user.role,
        email: data.user.email,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: data.user.id,
        role: data.user.role,
        email: data.user.email,
    });

    return {
        user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            emailVerified: data.user.emailVerified,
        },
        token: accessToken,
        refreshToken,
        sessionToken: data.token,
    };
};

const loginUser = async (payload: ILoginUserPayload): Promise<IAuthResponse> => {
    const { email, password } = payload;

    const data = await auth.api.signInEmail({
        body: {
            email,
            password,
        },
    });

    if (!data.user.isActive) {
        throw new AppError(status.FORBIDDEN, "User account is deactivated");
    }

    // Update last login
    await prisma.user.update({
        where: { id: data.user.id },
        data: { lastLoginAt: new Date() },
    });

    const accessToken = tokenUtils.getAccessToken({
        userId: data.user.id,
        role: data.user.role,
        email: data.user.email,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: data.user.id,
        role: data.user.role,
        email: data.user.email,
    });

    return {
        user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            emailVerified: data.user.emailVerified,
        },
        token: accessToken,
        refreshToken,
        sessionToken: data.token,
    };
};

const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            nickname: true,
            consultant: true,
            _count: {
                select: {
                    posts: true,
                    comments: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    return user;
};

const getNewToken = async (refreshToken: string, sessionToken: string): Promise<IAuthResponse> => {
    const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    });

    if (!session) {
        throw new AppError(status.UNAUTHORIZED, "Invalid session");
    }

    const verifiedToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET);

    if (!verifiedToken.success) {
        throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
    }

    const newAccessToken = tokenUtils.getAccessToken({
        userId: session.user.id,
        role: session.user.role,
        email: session.user.email,
    });

    const newRefreshToken = tokenUtils.getRefreshToken({
        userId: session.user.id,
        role: session.user.role,
        email: session.user.email,
    });

    // Update session expiry
    await prisma.session.update({
        where: { token: sessionToken },
        data: {
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        },
    });

    return {
        user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
            emailVerified: session.user.emailVerified,
        },
        token: newAccessToken,
        refreshToken: newRefreshToken,
        sessionToken,
    };
};

const changePassword = async (
    userId: string,
    payload: IChangePasswordPayload
): Promise<IAuthResponse> => {
    const { currentPassword, newPassword } = payload;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    // Use Better Auth to change password
    await auth.api.changePassword({
        body: {
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
        },
    });

    const accessToken = tokenUtils.getAccessToken({
        userId: user.id,
        role: user.role,
        email: user.email,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: user.id,
        role: user.role,
        email: user.email,
    });

    // Get new session
    const session = await prisma.session.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
        },
        token: accessToken,
        refreshToken,
        sessionToken: session?.token || "",
    };
};

const logoutUser = async (sessionToken: string) => {
    await auth.api.signOut({
        headers: new Headers({
            Authorization: `Bearer ${sessionToken}`,
        }),
    });

    return { message: "Logged out successfully" };
};

const verifyEmail = async (email: string, otp: string) => {
    await auth.api.verifyEmailOTP({
        body: {
            email,
            otp,
        },
    });

    return { message: "Email verified successfully" };
};

const forgetPassword = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if (!user.emailVerified) {
        throw new AppError(status.BAD_REQUEST, "Email not verified");
    }

    await auth.api.requestPasswordResetEmailOTP({
        body: { email },
    });

    return { message: "Password reset OTP sent to email" };
};

const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    await auth.api.resetPasswordEmailOTP({
        body: {
            email,
            otp,
            password: newPassword,
        },
    });

    // Delete all sessions for security
    await prisma.session.deleteMany({
        where: { userId: user.id },
    });

    return { message: "Password reset successfully" };
};

const googleLoginSuccess = async (sessionToken: string): Promise<IAuthResponse> => {
    const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    });

    if (!session?.user) {
        throw new AppError(status.UNAUTHORIZED, "Invalid session");
    }

    const user = session.user;

    // Create nickname if not exists
    const existingNickname = await prisma.nickname.findUnique({
        where: { userId: user.id },
    });

    if (!existingNickname) {
        const handle = `user_${Math.random().toString(36).substring(2, 8)}`;
        await prisma.nickname.create({
            data: {
                userId: user.id,
                handle,
                isActive: true,
            },
        });
    }

    const accessToken = tokenUtils.getAccessToken({
        userId: user.id,
        role: user.role,
        email: user.email,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: user.id,
        role: user.role,
        email: user.email,
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
        },
        token: accessToken,
        refreshToken,
        sessionToken: session.token,
    };
};

export const AuthService = {
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
