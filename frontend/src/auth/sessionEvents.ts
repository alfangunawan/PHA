let invalidSessionHandler: (() => void) | null = null;

export const setInvalidSessionHandler = (handler: (() => void) | null) => {
    invalidSessionHandler = handler;
};

export const notifyInvalidSession = () => {
    invalidSessionHandler?.();
};
