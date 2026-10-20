import express, { type Express } from 'express';
import type { Server } from 'node:http';
import type { BotClient } from '../core/client';
import config from '../core/config';
import { requireApiKey } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimit } from './middleware/rateLimit';
import { createApiRouter } from './routes';
import { ok } from './types';

const API_BASE_PATH = '/api/v1';

function createApp(client: BotClient): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(apiRateLimit);

  app.get('/health', (_req, res) => {
    res.json(ok({ status: 'online', guilds: client.guilds.cache.size, uptimeSeconds: Math.floor(process.uptime()) }));
  });

  app.use(API_BASE_PATH, requireApiKey, createApiRouter(client));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export function startApiServer(client: BotClient): Server | null {
  if (!config.apiKey) {
    console.warn('API_KEY is not set; skipping API server start-up. Set API_KEY in .env to enable it.');
    return null;
  }
  const app = createApp(client);
  const server = app.listen(config.apiPort, () => {
    console.log(`API: listening on port ${config.apiPort} (base path ${API_BASE_PATH})`);
  });
  return server;
}
