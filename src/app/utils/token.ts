import { Response } from "express";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import { envVars } from "../config/env";
import { CookieUtils } from "./cookie";
import { jwtUtils } from "./jwt";


// Creating access token
const getAccessToken = (payload: JwtPayload) => {
    const accessToken = jwtUtils.createToken(
        payload,
        envVars.ACCESS_TOKEN_SECRET,
        { expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN } as SignOptions
    );

    return accessToken;
}

const getRefreshToken = (payload: JwtPayload) => {
    const refreshToken = jwtUtils.createToken(
        payload,
        envVars.REFRESH_TOKEN_SECRET,
        { expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN } as SignOptions
    );
    return refreshToken;
}


const cookieOptions = {
    httpOnly: true,
    secure: envVars.NODE_ENV === "production",
    sameSite: envVars.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
    path: '/',
};

const setAccessTokenCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, 'accessToken', token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 1000, // 1 day
    });
}

const setRefreshTokenCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, 'refreshToken', token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 1000 * 7, // 7 days
    });
}

const setBetterAuthSessionCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, "better-auth.session_token", token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 1000, // 1 day
    });
}



export const tokenUtils = {
    getAccessToken,
    getRefreshToken,
    setAccessTokenCookie,
    setRefreshTokenCookie,
    setBetterAuthSessionCookie,
}
