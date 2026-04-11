export interface IReview {
    id: string;
    bookingId: string;
    clientId: string;
    consultantId: string;
    rating: number;
    content?: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IReviewCreate {
    bookingId: string;
    rating: number;
    content?: string;
    isPublic?: boolean;
}

export interface IReviewUpdate {
    rating?: number;
    content?: string;
    isPublic?: boolean;
}

export interface IReviewFilters {
    consultantId?: string;
    rating?: number;
    isPublic?: boolean;
}

export interface IReviewWithDetails extends IReview {
    client: {
        id: string;
        nickname?: {
            handle: string;
        } | null;
    };
    consultant: {
        id: string;
        professionalTitle: string;
        user: {
            name?: string | null;
        };
    };
}

export interface IReviewStats {
    consultantId: string;
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}
