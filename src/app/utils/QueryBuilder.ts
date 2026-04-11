import { PrismaFindManyArgs, PrismaCountArgs, PrismaModelDelegate, PrismaWhereConditions, PrismaStringFilter, PrismaNumberFilter } from "../interfaces/query.interface";

export class QueryBuilder<T> {
    private query: PrismaFindManyArgs;
    private countQuery: PrismaCountArgs;
    private page: number = 1;
    private limit: number = 10;
    private skip: number = 0;

    constructor(
        private model: PrismaModelDelegate,
        private queryParams: Record<string, unknown>,
        private searchableFields: string[] = [],
        private filterableFields: string[] = []
    ) {
        this.query = {
            where: {},
            orderBy: {},
            skip: 0,
            take: 10,
        };
        this.countQuery = { where: {} };
    }

    search(): this {
        const searchTerm = this.queryParams.searchTerm as string;

        if (searchTerm && this.searchableFields.length > 0) {
            const searchConditions = this.searchableFields.map((field) => {
                if (field.includes(".")) {
                    const parts = field.split(".");
                    if (parts.length === 2) {
                        const [relation, nestedField] = parts;
                        return {
                            [relation]: {
                                [nestedField]: {
                                    contains: searchTerm,
                                    mode: "insensitive",
                                },
                            },
                        };
                    }
                }
                return {
                    [field]: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                };
            });

            const whereConditions = this.query.where as PrismaWhereConditions;
            whereConditions.OR = searchConditions;

            const countWhereConditions = this.countQuery.where as PrismaWhereConditions;
            countWhereConditions.OR = searchConditions;
        }
        return this;
    }

    filter(): this {
        const excludedFields = ["searchTerm", "page", "limit", "sortBy", "sortOrder", "fields"];
        const filterParams: Record<string, unknown> = {};

        Object.keys(this.queryParams).forEach((key) => {
            if (!excludedFields.includes(key)) {
                filterParams[key] = this.queryParams[key];
            }
        });

        const queryWhere = this.query.where as Record<string, unknown>;
        const countQueryWhere = this.countQuery.where as Record<string, unknown>;

        Object.keys(filterParams).forEach((key) => {
            const value = filterParams[key];

            if (value === undefined || value === "") return;

            const isAllowed = this.filterableFields.length === 0 || this.filterableFields.includes(key);
            if (!isAllowed) return;

            // Handle nested fields (e.g., "nickname.handle")
            if (key.includes(".")) {
                const parts = key.split(".");
                if (parts.length === 2) {
                    const [relation, nestedField] = parts;
                    if (!queryWhere[relation]) queryWhere[relation] = {};
                    (queryWhere[relation] as Record<string, unknown>)[nestedField] = this.parseValue(value);
                    
                    if (!countQueryWhere[relation]) countQueryWhere[relation] = {};
                    (countQueryWhere[relation] as Record<string, unknown>)[nestedField] = this.parseValue(value);
                }
                return;
            }

            // Handle range filters (e.g., { gte: 10, lte: 100 })
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                queryWhere[key] = this.parseRangeFilter(value as Record<string, string | number>);
                countQueryWhere[key] = this.parseRangeFilter(value as Record<string, string | number>);
                return;
            }

            queryWhere[key] = this.parseValue(value);
            countQueryWhere[key] = this.parseValue(value);
        });

        return this;
    }

    paginate(): this {
        const page = Number(this.queryParams.page) || 1;
        const limit = Number(this.queryParams.limit) || 10;

        this.page = page;
        this.limit = limit;
        this.skip = (page - 1) * limit;

        this.query.skip = this.skip;
        this.query.take = limit;

        return this;
    }

    sort(): this {
        const sortBy = (this.queryParams.sortBy as string) || "createdAt";
        const sortOrder = this.queryParams.sortOrder === "asc" ? "asc" : "desc";

        if (sortBy.includes(".")) {
            const parts = sortBy.split(".");
            if (parts.length === 2) {
                const [relation, field] = parts;
                this.query.orderBy = {
                    [relation]: {
                        [field]: sortOrder,
                    },
                };
            }
        } else {
            this.query.orderBy = { [sortBy]: sortOrder };
        }

        return this;
    }

    include(relations: Record<string, unknown>): this {
        this.query.include = { ...(this.query.include || {}), ...relations };
        return this;
    }

    where(condition: Record<string, unknown>): this {
        this.query.where = this.deepMerge(this.query.where as Record<string, unknown>, condition);
        this.countQuery.where = this.deepMerge(this.countQuery.where as Record<string, unknown>, condition);
        return this;
    }

    async execute(): Promise<{ data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
        const [total, data] = await Promise.all([
            this.model.count(this.countQuery as Parameters<typeof this.model.count>[0]),
            this.model.findMany(this.query as Parameters<typeof this.model.findMany>[0]),
        ]);

        const totalPages = Math.ceil(total / this.limit);

        return {
            data: data as T[],
            meta: {
                page: this.page,
                limit: this.limit,
                total,
                totalPages,
            },
        };
    }

    private parseValue(value: unknown): unknown {
        if (value === "true") return true;
        if (value === "false") return false;
        if (typeof value === "string" && !isNaN(Number(value)) && value !== "") {
            return Number(value);
        }
        return value;
    }

    private parseRangeFilter(value: Record<string, string | number>): Record<string, unknown> {
        const rangeQuery: Record<string, unknown> = {};

        Object.keys(value).forEach((operator) => {
            const operatorValue = value[operator];
            const parsedValue = typeof operatorValue === "string" && !isNaN(Number(operatorValue))
                ? Number(operatorValue)
                : operatorValue;

            const validOperators = ["lt", "lte", "gt", "gte", "equals", "not", "contains", "startsWith", "endsWith", "in", "notIn"];
            if (validOperators.includes(operator)) {
                rangeQuery[operator] = parsedValue;
            }
        });

        return Object.keys(rangeQuery).length > 0 ? rangeQuery : value;
    }

    private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
                if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
                    result[key] = this.deepMerge(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
                } else {
                    result[key] = source[key];
                }
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }
}
