export interface ILoginUserPayload {
    email: string;
    password: string;
}

export interface IRegisterUserPayload {
    name: string;
    email: string;
    password: string;
}

export interface IChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface IAuthResponse {
    user: {
        id: string;
        email: string;
        name?: string | null;
        role: string;
        emailVerified: boolean;
    };
    accessToken: string;
    refreshToken: string;
    sessionToken: string;
}
