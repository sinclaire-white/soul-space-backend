export type TErrorSources = {
    path: string | number;
    message: string;
}

export type TErrorResponse = {
    success: boolean;
    message: string;
    errorSources: TErrorSources[];
    error?: unknown;
    stack?: string;
}
