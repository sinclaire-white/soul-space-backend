import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IUser, IUserCreate, IUserFilters, IUserUpdate } from "./user.interface";

const getAllUsers = async (filters: IUserFilters): Promise<IUser[]> => {
    const where: any = {};

    if (filters.role) {
        where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
    }

    if (filters.search) {
        where.OR = [
            { email: { contains: filters.search, mode: "insensitive" } },
            { name: { contains: filters.search, mode: "insensitive" } },
        ];
    }

    const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });

    return users as IUser[];
};

const getUserById = async (id: string): Promise<IUser | null> => {
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            nickname: true,
            consultant: true,
        },
    });

    return user as IUser | null;
};

const getUserByEmail = async (email: string): Promise<IUser | null> => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    return user as IUser | null;
};

const updateUser = async (id: string, payload: IUserUpdate): Promise<IUser | null> => {
    const user = await prisma.user.update({
        where: { id },
        data: payload,
    });

    return user as IUser;
};

const updateUserRole = async (id: string, role: UserRole): Promise<IUser | null> => {
    const user = await prisma.user.update({
        where: { id },
        data: { role },
    });

    return user as IUser;
};

const deactivateUser = async (id: string): Promise<IUser | null> => {
    const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
    });

    return user as IUser;
};

const activateUser = async (id: string): Promise<IUser | null> => {
    const user = await prisma.user.update({
        where: { id },
        data: { isActive: true },
    });

    return user as IUser;
};

const updateLastLogin = async (id: string): Promise<void> => {
    await prisma.user.update({
        where: { id },
        data: { lastLoginAt: new Date() },
    });
};

export const UserService = {
    getAllUsers,
    getUserById,
    getUserByEmail,
    updateUser,
    updateUserRole,
    deactivateUser,
    activateUser,
    updateLastLogin,
};
