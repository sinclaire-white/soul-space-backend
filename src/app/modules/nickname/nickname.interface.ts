export interface INickname {
    id: string;
    userId: string;
    handle: string;
    avatarUrl?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    rotatedAt: Date;
}

export interface INicknameCreate {
    userId: string;
    handle: string;
    avatarUrl?: string;
}

export interface INicknameUpdate {
    handle?: string;
    avatarUrl?: string;
}
