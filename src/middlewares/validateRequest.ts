import { NextFunction, Request, Response } from 'express';
import { ZodObject, ZodRawShape } from 'zod';

/**
 * Middleware to validate request data against a Zod schema.
 * @param schema The Zod schema to validate against.
 */
export const validateRequest = (schema: ZodObject<ZodRawShape>) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};
