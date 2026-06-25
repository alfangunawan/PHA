type ErrorLike = {
    response?: {
        status?: number;
        data?: {
            error?: unknown;
        };
    };
    message?: unknown;
};

const invalidTokenPattern = /invalid or expired token/i;

const parseErrorText = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    try {
        const parsed = JSON.parse(value);
        if (typeof parsed?.error === 'string') return parsed.error;
    } catch {
        return value;
    }
    return value;
};

export const getAuthErrorText = (error: unknown): string => {
    if (typeof error === 'string') return parseErrorText(error);

    const err = error as ErrorLike;
    if (typeof err?.response?.data?.error === 'string') return err.response.data.error;
    if (typeof err?.message === 'string') return parseErrorText(err.message);

    return '';
};

export const isInvalidAuthError = (error: unknown): boolean => {
    const err = error as ErrorLike;
    if (err?.response?.status === 401) return true;

    const message = getAuthErrorText(error);
    return invalidTokenPattern.test(message);
};
