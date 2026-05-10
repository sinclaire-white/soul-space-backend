import { UserRole } from "../../../../prisma/generated/prisma/enums";
import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary";
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

const updateUser = async (id: string, payload: IUserUpdate, imageFile?: Express.Multer.File): Promise<IUser | null> => {
    const data: any = { ...payload };

    if (imageFile) {
        // Get current user to check for existing image
        const currentUser = await prisma.user.findUnique({ where: { id }, select: { image: true } });

        // Upload new image
        const dataUri = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}`;
        const uploaded = await uploadToCloudinary(dataUri, "soul-space/profiles");
        data.image = uploaded.url;

        // Delete old image if exists
        if (currentUser?.image) {
            const oldPublicId = currentUser.image.split("/").slice(-2).join("/").split(".")[0];
            await deleteFromCloudinary(oldPublicId).catch(() => {});
        }
    }

    const user = await prisma.user.update({
        where: { id },
        data,
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

const getPublicProfile = async (userId: string): Promise<object | null> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            isProfilePublic: true,
            createdAt: true,
            nickname: {
                select: { handle: true, avatarUrl: true },
            },
            posts: {
                where: { isAnonymous: false, status: "ACTIVE", deletedAt: null },
                orderBy: { createdAt: "desc" },
                take: 20,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    viewCount: true,
                    _count: { select: { comments: true, reactions: true } },
                },
            },
        },
    });

    if (!user) return null;

    if (!user.isProfilePublic) {
        return {
            id: user.id,
            nickname: user.nickname,
            isProfilePublic: false,
        };
    }

    return user;
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
    getPublicProfile,
};
