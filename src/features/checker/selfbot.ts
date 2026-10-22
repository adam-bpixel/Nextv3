import { Client as SelfbotClient, type Guild as SelfbotGuild } from 'discord.js-selfbot-v13';

const clients = new Map<string, SelfbotClient>();
const logins = new Map<string, Promise<SelfbotClient>>();
let nextApiToken = 0;

const tokens = (): string[] => [...new Set((process.env.SELFBOT_TOKEN ?? '').split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean))];
export const isConfigured = (): boolean => tokens().length > 0;
const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function checkerApiPing(): number | null {
  for (const client of clients.values()) {
    if (!client.isReady()) continue;
    const ping = client.ws.ping;
    if (Number.isFinite(ping) && ping >= 0) return ping;
  }
  return null;
}

async function callApi<T>(route: string, init: (token: string) => RequestInit): Promise<T> {
  const available = tokens();
  if (!available.length) throw new Error('SELFBOT_TOKEN is not configured.');

  let lastError = new Error('Discord API request failed.');
  for (let attempt = 0; attempt < available.length; attempt++) {
    const token = available[(nextApiToken + attempt) % available.length] ?? '';
    const response = await fetch(`https://discord.com/api/v10${route}`, { ...init(token), signal: AbortSignal.timeout(15_000) }).catch(() => null);
    if (response?.ok) {
      nextApiToken = (nextApiToken + attempt + 1) % available.length;
      return response.json() as Promise<T>;
    }
    lastError = new Error(`Discord API returned HTTP ${response?.status ?? 'no response'}.`);
  }
  throw lastError;
}

export function selfbotApiGet<T>(route: string): Promise<T> {
  return callApi<T>(route, (token) => ({ headers: { Authorization: token, Accept: 'application/json' } }));
}

export function selfbotApiPost<T>(route: string, body: unknown): Promise<T> {
  return callApi<T>(route, (token) => ({
    method: 'POST',
    headers: { Authorization: token, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

function loginWith(token: string): Promise<SelfbotClient> {
  const existing = clients.get(token);
  if (existing) return Promise.resolve(existing);
  let pending = logins.get(token);
  if (!pending) {
    const instance = new SelfbotClient({ presence: { status: 'invisible' } });
    pending = instance
      .login(token)
      .then(() => {
        clients.set(token, instance);
        return instance;
      })
      .catch((error: unknown) => {
        logins.delete(token);
        throw error;
      });
    logins.set(token, pending);
  }
  return pending;
}

export async function ensureAllLoggedIn(): Promise<SelfbotClient[]> {
  const results = await Promise.allSettled(tokens().map((token) => loginWith(token)));
  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

export async function ensureLoggedIn(): Promise<SelfbotClient> {
  let lastError: unknown = new Error('SELFBOT_TOKEN is not configured.');
  for (const token of tokens()) {
    try {
      return await loginWith(token);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function findSelfbotGuild(guildId: string): Promise<SelfbotGuild | null> {
  for (const client of await ensureAllLoggedIn()) {
    const guild = client.guilds.cache.get(guildId);
    if (guild) return guild;
  }
  return null;
}

export function warmUp(): void {
  for (const token of tokens()) {
    void loginWith(token).catch((error: unknown) => console.error('[selfbot]', errorMessage(error)));
  }
}
