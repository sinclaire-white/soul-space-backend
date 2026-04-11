import { UserRole, PostVisibility } from "../../../generated/prisma/enums";

export interface IUser {
    id: string;
    email: string;
    emailVerified: boolean;
    name?: string | null;
    image?: string | null;
    role: UserRole;
    isActive: boolean;
    defaultPostVisibility: PostVisibility;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date | null;
}

export interface IUserCreate {
    email: string;
    name?: string;
    role?: UserRole;
}

export interface IUserUpdate {
    name?: string;
    defaultPostVisibility?: PostVisibility;
}

export interface IUserFilters {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
}
