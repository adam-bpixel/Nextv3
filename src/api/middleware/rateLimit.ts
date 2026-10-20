import rateLimit from 'express-rate-limit';
import { fail } from '../types';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;

export const apiRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_REQUESTS_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(fail('Too many requests. Please slow down.'));
  },
});
