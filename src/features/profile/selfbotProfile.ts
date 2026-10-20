import { ensureLoggedIn, isConfigured } from '../checker/selfbot';

const SELFBOT_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 5 * 60 * 1000;


export interface RawSelfbotProfile {
  badges?: unknown;
  connected_accounts?: unknown;
}

const cache = new Map<string, { profile: RawSelfbotProfile | null; cachedAt: number }>();
// Badges and connections both pull from this same profile and are normally fetched together via
// Promise.all; dedupe so that doesn't turn into two selfbot requests for the same user.
const inFlight = new Map<string, Promise<RawSelfbotProfile | null>>();


export async function fetchSelfbotProfile(userId: string): Promise<RawSelfbotProfile | null> {
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.profile;
  if (!isConfigured()) return null;

  const pending = inFlight.get(userId);
  if (pending) return pending;

  const attempt = (async (): Promise<RawSelfbotProfile | null> => {
    try {
      const selfbot = await ensureLoggedIn();
      const selfbotUser = await selfbot.users.fetch(userId).catch(() => null);
      if (!selfbotUser) return null;
      return (await selfbotUser.getProfile()) as RawSelfbotProfile;
    } catch {
      return null;
    }
  })();

  // The selfbot session can take well over a minute to (re)connect on a cold start; don't let
  // that stall the whole /profile command — fall back instead if it isn't ready in time.
  const request = Promise.race([attempt, new Promise<null>((resolve) => setTimeout(() => resolve(null), SELFBOT_TIMEOUT_MS))])
    .then((profile) => {
      cache.set(userId, { profile, cachedAt: Date.now() });
      return profile;
    })
    .finally(() => inFlight.delete(userId));

  inFlight.set(userId, request);
  return request;
}
