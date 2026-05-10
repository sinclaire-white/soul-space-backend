import { PostVisibility, UserRole } from "../../../../prisma/generated/prisma/enums";

export interface IUser {
    id: string;
    email: string;
    emailVerified: boolean;
    name?: string | null;
    image?: string | null;
    phone?: string | null;
    age?: number | null;
    bio?: string | null;
    role: UserRole;
    isActive: boolean;
    defaultPostVisibility: PostVisibility;
    isProfilePublic: boolean;
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
    image?: string;
    phone?: string;
    age?: number;
    bio?: string;
    defaultPostVisibility?: PostVisibility;
    isProfilePublic?: boolean;
}

export interface IUserFilters {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
}
