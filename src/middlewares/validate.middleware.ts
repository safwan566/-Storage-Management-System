import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { HTTP_STATUS } from '../config/constants';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          message: 'Validation failed',
          error: {
            message: 'Validation failed',
            details: errorMessages,
          },
        });
        return;
      }
      
      return next(error);
    }
  };
};

