import type { Guild } from 'discord.js';

// Discord does not say which invite a new member used, so we keep the last-seen `uses` count
// per invite code and diff against the freshly fetched list on every join: whichever code's
// uses increased is the one that was used. This cache is rebuilt from Discord's own numbers on
// every check, so losing it on a restart only costs the very first join after that restart.
const usesCache = new Map<string, Map<string, number>>();

export async function primeInviteCache(guild: Guild): Promise<void> {
  try {
    const invites = await guild.invites.fetch();
    const map = new Map<string, number>();
    for (const invite of invites.values()) map.set(invite.code, invite.uses ?? 0);
    usesCache.set(guild.id, map);
  } catch {
    // Missing Manage Server permission: invite tracking silently stays disabled for this guild.
  }
}

export interface InviteMatch {
  inviterId: string | null;
}

export async function matchUsedInvite(guild: Guild): Promise<InviteMatch> {
  const previous = usesCache.get(guild.id) ?? new Map<string, number>();
  let invites;
  try {
    invites = await guild.invites.fetch();
  } catch {
    return { inviterId: null };
  }

  let inviterId: string | null = null;
  const next = new Map<string, number>();
  for (const invite of invites.values()) {
    next.set(invite.code, invite.uses ?? 0);
    if (inviterId === null && (invite.uses ?? 0) > (previous.get(invite.code) ?? 0)) {
      inviterId = invite.inviter?.id ?? null;
    }
  }
  usesCache.set(guild.id, next);
  return { inviterId };
}
