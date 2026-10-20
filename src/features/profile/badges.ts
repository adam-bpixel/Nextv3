import type { User } from 'discord.js';
import { fetchSelfbotProfile } from './selfbotProfile';

export interface ProfileBadge {
  id: string;
  description: string;
  
  icon?: string;
}

interface RawProfileBadge {
  id?: unknown;
  description?: unknown;
  icon?: unknown;
}

function parseBadges(badges: unknown): ProfileBadge[] {
  if (!Array.isArray(badges)) return [];
  const parsed: ProfileBadge[] = [];
  for (const entry of badges as RawProfileBadge[]) {
    if (typeof entry.id !== 'string') continue;
    const description = typeof entry.description === 'string' ? entry.description : entry.id;
    parsed.push(typeof entry.icon === 'string' ? { id: entry.id, description, icon: entry.icon } : { id: entry.id, description });
  }
  return parsed;
}


const FLAG_TO_BADGE_ID: Record<string, string> = {
  Staff: 'staff',
  Partner: 'partner',
  Hypesquad: 'hypesquad',
  BugHunterLevel1: 'bug_hunter_level_1',
  BugHunterLevel2: 'bug_hunter_level_2',
  HypeSquadOnlineHouse1: 'hypesquad_house_1',
  HypeSquadOnlineHouse2: 'hypesquad_house_2',
  HypeSquadOnlineHouse3: 'hypesquad_house_3',
  PremiumEarlySupporter: 'early_supporter',
  VerifiedBot: 'verified_bot',
  VerifiedDeveloper: 'verified_developer',
  CertifiedModerator: 'certified_moderator',
  ActiveDeveloper: 'active_developer',
};

function fallbackBadgesFromFlags(user: User): ProfileBadge[] {
  const flags = user.flags?.toArray() ?? [];
  const badges: ProfileBadge[] = [];
  for (const flag of flags) {
    const id = FLAG_TO_BADGE_ID[flag];
    if (id) badges.push({ id, description: flag });
  }
  return badges;
}


export async function fetchUserProfileBadges(user: User): Promise<ProfileBadge[]> {
  const profile = await fetchSelfbotProfile(user.id);
  return profile ? parseBadges(profile.badges) : fallbackBadgesFromFlags(user);
}
