import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { INickname, INicknameCreate, INicknameUpdate } from "./nickname.interface";

const MIN_ROTATION_DAYS = 90; // 3 months

const createNickname = async (payload: INicknameCreate): Promise<INickname> => {
    // Check if handle is already taken
    const existingNickname = await prisma.nickname.findUnique({
        where: { handle: payload.handle },
    });

    if (existingNickname) {
        throw new AppError(status.CONFLICT, "Handle is already taken");
    }

    // Check if user already has a nickname
    const userNickname = await prisma.nickname.findUnique({
        where: { userId: payload.userId },
    });

    if (userNickname) {
        throw new AppError(status.CONFLICT, "User already has a nickname");
    }

    const nickname = await prisma.nickname.create({
        data: payload,
    });

    return nickname as INickname;
};

const getNicknameByUserId = async (userId: string): Promise<INickname | null> => {
    const nickname = await prisma.nickname.findUnique({
        where: { userId },
    });

    return nickname as INickname | null;
};

const getNicknameByHandle = async (handle: string): Promise<INickname | null> => {
    const nickname = await prisma.nickname.findUnique({
        where: { handle },
    });

    return nickname as INickname | null;
};

const updateNickname = async (
    userId: string,
    payload: INicknameUpdate
): Promise<INickname | null> => {
    if (payload.handle) {
        const existing = await prisma.nickname.findUnique({ where: { handle: payload.handle } });
        if (existing && existing.userId !== userId) {
            throw new AppError(status.CONFLICT, "Handle is already taken");
        }
    }

    const nickname = await prisma.nickname.update({
        where: { userId },
        data: payload,
    });

    return nickname as INickname;
};

const rotateNickname = async (
    userId: string,
    newHandle: string
): Promise<INickname | null> => {
    const existingNickname = await prisma.nickname.findUnique({
        where: { userId },
    });

    if (!existingNickname) {
        throw new AppError(status.NOT_FOUND, "Nickname not found");
    }

    // Check if 90 days have passed since last rotation
    const lastRotation = new Date(existingNickname.rotatedAt);
    const now = new Date();
    const daysSinceRotation = Math.floor(
        (now.getTime() - lastRotation.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceRotation < MIN_ROTATION_DAYS) {
        const daysRemaining = MIN_ROTATION_DAYS - daysSinceRotation;
        throw new AppError(
            status.FORBIDDEN,
            `You can rotate your nickname in ${daysRemaining} days`
        );
    }

    // Check if new handle is available
    const handleTaken = await prisma.nickname.findUnique({
        where: { handle: newHandle },
    });

    if (handleTaken) {
        throw new AppError(status.CONFLICT, "Handle is already taken");
    }

    const nickname = await prisma.nickname.update({
        where: { userId },
        data: {
            handle: newHandle,
            rotatedAt: new Date(),
        },
    });

    return nickname as INickname;
};

const checkHandleAvailability = async (handle: string): Promise<boolean> => {
    const existing = await prisma.nickname.findUnique({
        where: { handle },
    });

    return !existing;
};

export const NicknameService = {
    createNickname,
    getNicknameByUserId,
    getNicknameByHandle,
    updateNickname,
    rotateNickname,
    checkHandleAvailability,
};
