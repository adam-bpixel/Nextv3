import type { NextFunction, Request, Response } from 'express';
import config from '../../core/config';
import { unauthorized } from '../errors';

const API_KEY_HEADER = 'x-api-key';

export function requireApiKey(req: Request, _res: Response, next: NextFunction): void {
  if (!config.apiKey) {
    next(unauthorized('API_KEY is not configured on the server.'));
    return;
  }
  const provided = req.header(API_KEY_HEADER);
  if (provided !== config.apiKey) {
    next(unauthorized('Invalid or missing API key.'));
    return;
  }
  next();
}
