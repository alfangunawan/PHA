import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            console.log('Validation Error Caught:', error);
            console.log('Error keys:', Object.keys(error));
            const errors = (error as any).errors || (error as any).issues || [];

            return res.status(400).json({
                error: 'Validation Error',
                details: errors.map((e: any) => ({
                    path: e.path ? e.path.join('.') : 'unknown',
                    message: e.message,
                })),
            });
        }
        next(error);
    }
};
