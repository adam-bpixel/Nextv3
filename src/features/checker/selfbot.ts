import { Client as SelfbotClient } from 'discord.js-selfbot-v13';

let client: SelfbotClient | null = null;
let loginPromise: Promise<SelfbotClient> | null = null;

const token = (): string => (process.env.SELFBOT_TOKEN ?? '').trim();
export const isConfigured = (): boolean => token().length > 0;
const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function checkerApiPing(): number | null {
  if (!client?.isReady()) return null;
  const ping = client.ws.ping;
  return Number.isFinite(ping) && ping >= 0 ? ping : null;
}


export async function selfbotApiGet<T>(route: string): Promise<T> {
  const authToken = token();
  if (!authToken) throw new Error('SELFBOT_TOKEN is not configured.');

  const response = await fetch(`https://discord.com/api/v10${route}`, {
    headers: { Authorization: authToken, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Discord API returned HTTP ${response.status}.`);
  return response.json() as Promise<T>;
}

export function ensureLoggedIn(): Promise<SelfbotClient> {
  if (client) return Promise.resolve(client);
  if (!loginPromise) {
    const instance = new SelfbotClient({ presence: { status: 'invisible' } });
    loginPromise = instance
      .login(token())
      .then(() => {
        client = instance;
        return instance;
      })
      .catch((error: unknown) => {
        loginPromise = null;
        throw error;
      });
  }
  return loginPromise;
}

export function warmUp(): void {
  if (!isConfigured()) return;
  void ensureLoggedIn().catch((error: unknown) => console.error('[selfbot]', errorMessage(error)));
}
