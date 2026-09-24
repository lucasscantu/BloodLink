import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

/** Valida req.body contra um schema Zod, retornando 400 com detalhes em caso de erro. */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Dados inválidos.",
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}

/** Middleware global de tratamento de erros não capturados. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  console.error(err);
  const message = err instanceof Error ? err.message : "Erro interno do servidor.";
  res.status(500).json({ error: message });
}
