import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate based on request method
      let data;
      
      if (req.method === 'GET') {
        data = req.query;
      } else {
        data = req.body;
      }

      const validatedData = schema.parse(data);
      
      // Attach validated data to request
      if (req.method !== 'GET') {
        req.body = validatedData;
      } else {
        req.query = validatedData;
      }

      next();
    } catch (error: any) {
      console.error('Validation error:', error.message);
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos.',
        errors: error.errors?.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        })) || [],
      });
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams;
      next();
    } catch (error: any) {
      console.error('Params validation error:', error.message);
      return res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos.',
        errors: error.errors?.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        })) || [],
      });
    }
  };
};
