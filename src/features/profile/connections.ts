import type { User } from 'discord.js';
import { fetchSelfbotProfile } from './selfbotProfile';

export interface UserConnection {
  type: string;
  name: string;
  verified: boolean;
}

interface RawConnection {
  type?: unknown;
  name?: unknown;
  verified?: unknown;
}

function parseConnections(connectedAccounts: unknown): UserConnection[] {
  if (!Array.isArray(connectedAccounts)) return [];
  const connections: UserConnection[] = [];
  for (const entry of connectedAccounts as RawConnection[]) {
    if (typeof entry.type !== 'string' || typeof entry.name !== 'string') continue;
    connections.push({ type: entry.type, name: entry.name, verified: entry.verified === true });
  }
  return connections;
}


export async function fetchUserConnections(user: User): Promise<UserConnection[]> {
  const profile = await fetchSelfbotProfile(user.id);
  return profile ? parseConnections(profile.connected_accounts) : [];
}
