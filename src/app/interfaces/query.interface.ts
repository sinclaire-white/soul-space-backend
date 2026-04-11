// Query Builder Interfaces

export interface IQueryParams {
    searchTerm?: string;
    page?: string | number;
    limit?: string | number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    fields?: string;
    [key: string]: unknown;
}

export interface IQueryResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PrismaFindManyArgs {
    where?: Record<string, unknown>;
    select?: Record<string, boolean | Record<string, unknown>>;
    include?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    skip?: number;
    take?: number;
}

export interface PrismaCountArgs {
    where?: Record<string, unknown>;
}

export interface PrismaWhereConditions {
    AND?: Record<string, unknown>[];
    OR?: Record<string, unknown>[];
    NOT?: Record<string, unknown>[];
    [key: string]: unknown;
}

export interface PrismaStringFilter {
    contains?: string;
    startsWith?: string;
    endsWith?: string;
    equals?: string;
    not?: string;
    mode?: "default" | "insensitive";
}

export interface PrismaNumberFilter {
    lt?: number;
    lte?: number;
    gt?: number;
    gte?: number;
    equals?: number;
    not?: number;
}

export type PrismaModelDelegate = {
    findMany: (args: unknown) => Promise<unknown[]>;
    count: (args: unknown) => Promise<number>;
};
