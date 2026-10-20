import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors';
import { fail } from '../types';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(fail(`No route for ${req.method} ${req.path}`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof HttpError) {
    res.status(error.status).json(fail(error.message));
    return;
  }
  console.error('API error:', error);
  res.status(500).json(fail('Internal server error.'));
}
