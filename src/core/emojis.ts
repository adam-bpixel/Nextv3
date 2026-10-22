import type { Client } from 'discord.js';
import { BADGE_ICON_HASHES } from '../features/profile/badgeIcons';

export interface EmojiObject {
  id: string;
  name: string;
  animated?: boolean;
}

export interface EmojiResolvableSource {
  readonly id: string;
  readonly name: string | null;
  readonly animated?: boolean;
}

export interface EmojiResolutionResult {
  readonly total: number;
  readonly resolved: number;
  readonly missing: readonly string[];
}

export interface FallbackEmojiData {
  readonly name: string;
  readonly id: string;
  readonly animated: boolean;
}

export const ARROW_LEFT_GOLD: EmojiObject = {
  id: '1560754447720648825',
  name: 'arrow_left_gold',
  animated: true,
};

export const ARROW_RIGHT_GOLD: EmojiObject = {
  id: '1560754445397262489',
  name: 'arrow_right_gold',
  animated: true,
};

export const GAMEFINDER_JOIN_ICON: EmojiObject = {
  id: '1561738685706281141',
  name: 'gamefinder_join',
};

export let TOPMA_ICON = '<:imageremovebgpreview31:1560807209821020270>';
export let FULLCHECK_ICON = '<:fullcheck_gold:1561016269162156146>';
export let CHECKROLES_ICON = '<:checkroles_gold:1561016271137411163>';
export let SERVERS_ICON = '<a:694016yellowplanet:1561028784340078622>';
export let APPLY_ACCEPT_ICON = '<:apply_accept:1561425406840537163>';
export let APPLY_REJECT_ICON = '<:apply_reject:1561425408774242454>';
export let AUTOREPLY_ADD_ICON = '<:autoreply_add:1561442006037700708>';
export let AUTOREPLY_REMOVE_ICON = '<:autoreply_remove:1561442008847880284>';
export let AUTOREPLY_LIST_ICON = '<:autoreply_list:1561442011905523802>';
export let INVENTORY_HEADER_ICON = '<:inventory_header_gray:1561821788315586572>';
export let INVENTORY_PROFILES_ICON = '<:inventory_profiles_gray:1561821797048131677>';
export let INVENTORY_BALANCE_ICON = '<:inventory_balance_gray:1561821805436739758>';
export let INVENTORY_BOOST_ICON = '<:inventory_boost_gray:1561821820645015642>';
export let GAMEFINDER_ICON = '<:gamefinder_icon:1561738679305773168>';
export let GAMEFINDER_PLAYER_ICON = '<:gamefinder_player:1561738683781226608>';
export let VOICECHECK_MUTE_ICON = '<:voicecheck_mute:1561744564979634300>';
export let VOICECHECK_DEAFEN_ICON = '<:voicecheck_deafen:1561744567831625738>';
export let VOICECHECK_MIC_ICON = '<:voicecheck_mic:1561747616994431099>';
export let PREMIUM_DIAMOND_GRAY_ICON = '<:premium_diamond_gray:1561814803553460255>';
export let PREMIUM_DIAMOND_BLUE_ICON = '<:premium_diamond_blue:1561814805294227499>';

const mutableHelpCategoryIcons: Record<string, string> = {
  Checker: '<:help_checker:1561803056377626735>',
  moderation: '<:help_moderation:1561803059284283504>',
  admin: '<:help_admin:1561803063390634025>',
  games: '<:help_fun:1561803066922238063>',
  social: '<:help_fun:1561803066922238063>',
  Verification: '<:help_verification:1561803071099637881>',
  Information: '<:help_information:1561803083699462326>',
  owner: '<:help_owner:1561803085981032450>',
  Profile: '<:help_profile:1561803088992407602>',
  Top: '<:help_top:1561803091622502483>',
  premium: '<:help_premium:1561803094977679410>',
  Warning: '<:help_warning:1561803097657974846>',
  Levels: '<:help_levels:1561803100937916456>',
  security: '<:help_security:1561803103907348532>',
  setup: '<:help_setup:1561803109297291344>',
  utility: '<:help_utility:1561803112140902572>',
  Jail: '<:help_jail:1561803118252130465>',
  economy: '<:help_economy:1561909342028963941>',
  clan_commands: '<:help_clans:1561803121036894218>',
  setup_slash_commands: '<:help_slash:1561803124614635680>',
};

export const HELP_CATEGORY_ICONS: Readonly<Record<string, string>> = mutableHelpCategoryIcons;

const mutableNumberEmojis: Record<number, string> = {
  0: '<:num_0_gray:1561821833274204330>',
  1: '<:num_1_gray:1561821844103757944>',
  2: '<:num_2_gray:1561821854208106567>',
  3: '<:num_3_gray:1561821863246569604>',
  4: '<:num_4_gray:1561821872658579487>',
  5: '<:num_5_gray:1561821883366768672>',
  6: '<:num_6_gray:1561821893156413560>',
  7: '<:num_7_gray:1561821903260356680>',
  8: '<:num_8_gray:1561821915201667123>',
  9: '<:num_9_gray:1561821928413601946>',
};

export const NUMBER_EMOJIS: Readonly<Record<number, string>> = mutableNumberEmojis;

export function numberEmoji(value: number): string {
  return String(Math.max(0, value))
    .split('')
    .map((digit) => mutableNumberEmojis[Number(digit)] ?? '')
    .join('');
}

const OBJECT_EMOJI_TARGETS: readonly EmojiObject[] = [
  ARROW_LEFT_GOLD,
  ARROW_RIGHT_GOLD,
  GAMEFINDER_JOIN_ICON,
];

const FALLBACK_OBJECT_EMOJIS: Readonly<Record<string, { readonly id: string; readonly animated?: boolean }>> = {
  arrow_left_gold: { id: '1560754447720648825', animated: true },
  arrow_right_gold: { id: '1560754445397262489', animated: true },
  gamefinder_join: { id: '1561738685706281141' },
};

interface StringEmojiBinding {
  readonly name: string;
  readonly fallback: string;
  readonly set: (val: string) => void;
}

const STRING_EMOJI_BINDINGS: readonly StringEmojiBinding[] = [
  { name: 'imageremovebgpreview31', fallback: '<:imageremovebgpreview31:1560807209821020270>', set: (val) => { TOPMA_ICON = val; } },
  { name: 'fullcheck_gold', fallback: '<:fullcheck_gold:1561016269162156146>', set: (val) => { FULLCHECK_ICON = val; } },
  { name: 'checkroles_gold', fallback: '<:checkroles_gold:1561016271137411163>', set: (val) => { CHECKROLES_ICON = val; } },
  { name: '694016yellowplanet', fallback: '<a:694016yellowplanet:1561028784340078622>', set: (val) => { SERVERS_ICON = val; } },
  { name: 'apply_accept', fallback: '<:apply_accept:1561425406840537163>', set: (val) => { APPLY_ACCEPT_ICON = val; } },
  { name: 'apply_reject', fallback: '<:apply_reject:1561425408774242454>', set: (val) => { APPLY_REJECT_ICON = val; } },
  { name: 'autoreply_add', fallback: '<:autoreply_add:1561442006037700708>', set: (val) => { AUTOREPLY_ADD_ICON = val; } },
  { name: 'autoreply_remove', fallback: '<:autoreply_remove:1561442008847880284>', set: (val) => { AUTOREPLY_REMOVE_ICON = val; } },
  { name: 'autoreply_list', fallback: '<:autoreply_list:1561442011905523802>', set: (val) => { AUTOREPLY_LIST_ICON = val; } },
  { name: 'inventory_header_gray', fallback: '<:inventory_header_gray:1561821788315586572>', set: (val) => { INVENTORY_HEADER_ICON = val; } },
  { name: 'inventory_profiles_gray', fallback: '<:inventory_profiles_gray:1561821797048131677>', set: (val) => { INVENTORY_PROFILES_ICON = val; } },
  { name: 'inventory_balance_gray', fallback: '<:inventory_balance_gray:1561821805436739758>', set: (val) => { INVENTORY_BALANCE_ICON = val; } },
  { name: 'inventory_boost_gray', fallback: '<:inventory_boost_gray:1561821820645015642>', set: (val) => { INVENTORY_BOOST_ICON = val; } },
  { name: 'gamefinder_icon', fallback: '<:gamefinder_icon:1561738679305773168>', set: (val) => { GAMEFINDER_ICON = val; } },
  { name: 'gamefinder_player', fallback: '<:gamefinder_player:1561738683781226608>', set: (val) => { GAMEFINDER_PLAYER_ICON = val; } },
  { name: 'voicecheck_mute', fallback: '<:voicecheck_mute:1561744564979634300>', set: (val) => { VOICECHECK_MUTE_ICON = val; } },
  { name: 'voicecheck_deafen', fallback: '<:voicecheck_deafen:1561744567831625738>', set: (val) => { VOICECHECK_DEAFEN_ICON = val; } },
  { name: 'voicecheck_mic', fallback: '<:voicecheck_mic:1561747616994431099>', set: (val) => { VOICECHECK_MIC_ICON = val; } },
  { name: 'premium_diamond_gray', fallback: '<:premium_diamond_gray:1561814803553460255>', set: (val) => { PREMIUM_DIAMOND_GRAY_ICON = val; } },
  { name: 'premium_diamond_blue', fallback: '<:premium_diamond_blue:1561814805294227499>', set: (val) => { PREMIUM_DIAMOND_BLUE_ICON = val; } },
];

function extractEmojiName(tag: string): string | undefined {
  const match = /^<(?:a)?:([^:]+):\d+>$/.exec(tag);
  return match ? match[1] : undefined;
}

const FALLBACK_HELP_CATEGORY_ICONS: Readonly<Record<string, string>> = { ...mutableHelpCategoryIcons };
const FALLBACK_NUMBER_EMOJIS: Readonly<Record<number, string>> = { ...mutableNumberEmojis };

const HELP_CATEGORY_NAMES: readonly (readonly [category: string, emojiName: string])[] = Object.entries(
  FALLBACK_HELP_CATEGORY_ICONS,
).flatMap(([cat, tag]) => {
  const name = extractEmojiName(tag);
  return name ? ([[cat, name]] as const) : [];
});

const NUMBER_EMOJI_NAMES: readonly (readonly [digit: number, emojiName: string])[] = Object.entries(
  FALLBACK_NUMBER_EMOJIS,
).flatMap(([digitStr, tag]) => {
  const name = extractEmojiName(tag);
  return name ? ([[Number(digitStr), name]] as const) : [];
});

const ALL_REQUIRED_EMOJI_NAMES: readonly string[] = Array.from(
  new Set<string>([
    ...OBJECT_EMOJI_TARGETS.map((obj) => obj.name),
    ...STRING_EMOJI_BINDINGS.map((entry) => entry.name),
    ...HELP_CATEGORY_NAMES.map(([, name]) => name),
    ...NUMBER_EMOJI_NAMES.map(([, name]) => name),
  ]),
);

export const FALLBACK_DEFINITIONS: ReadonlyMap<string, FallbackEmojiData> = (() => {
  const map = new Map<string, FallbackEmojiData>();
  function register(tag: string): void {
    const match = /^<(a)?:([^:]+):(\d+)>$/.exec(tag);
    if (!match) return;
    const animated = match[1] === 'a';
    const name = match[2];
    const id = match[3];
    if (name && id) map.set(name.toLowerCase(), { name, id, animated });
  }

  map.set('arrow_left_gold', { name: 'arrow_left_gold', id: '1560754447720648825', animated: true });
  map.set('arrow_right_gold', { name: 'arrow_right_gold', id: '1560754445397262489', animated: true });
  map.set('gamefinder_join', { name: 'gamefinder_join', id: '1561738685706281141', animated: false });

  for (const binding of STRING_EMOJI_BINDINGS) {
    register(binding.fallback);
  }
  for (const tag of Object.values(FALLBACK_HELP_CATEGORY_ICONS)) {
    register(tag);
  }
  for (const tag of Object.values(FALLBACK_NUMBER_EMOJIS)) {
    register(tag);
  }
  return map;
})();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resolveEmojis(
  emojis: Iterable<EmojiResolvableSource>,
): EmojiResolutionResult {
  const available = new Map<string, { id: string; name: string; animated: boolean }>();
  for (const emoji of emojis) {
    if (emoji.name) {
      available.set(emoji.name.toLowerCase(), {
        id: emoji.id,
        name: emoji.name,
        animated: emoji.animated ?? false,
      });
    }
  }

  let resolved = 0;
  const missing: string[] = [];

  for (const name of ALL_REQUIRED_EMOJI_NAMES) {
    if (available.has(name.toLowerCase())) {
      resolved++;
    } else {
      missing.push(name);
    }
  }

  for (const obj of OBJECT_EMOJI_TARGETS) {
    const match = available.get(obj.name.toLowerCase());
    if (match) {
      obj.id = match.id;
      if (match.animated) {
        obj.animated = true;
      } else if ('animated' in obj) {
        obj.animated = false;
      }
    } else {
      const fallback = FALLBACK_OBJECT_EMOJIS[obj.name];
      if (fallback) {
        obj.id = fallback.id;
        if (fallback.animated !== undefined) {
          obj.animated = fallback.animated;
        }
      }
    }
  }

  for (const binding of STRING_EMOJI_BINDINGS) {
    const match = available.get(binding.name.toLowerCase());
    if (match) {
      const tag = match.animated ? `<a:${match.name}:${match.id}>` : `<:${match.name}:${match.id}>`;
      binding.set(tag);
    } else {
      binding.set(binding.fallback);
    }
  }

  for (const [cat, name] of HELP_CATEGORY_NAMES) {
    const match = available.get(name.toLowerCase());
    if (match) {
      const tag = match.animated ? `<a:${match.name}:${match.id}>` : `<:${match.name}:${match.id}>`;
      mutableHelpCategoryIcons[cat] = tag;
    } else {
      const fallback = FALLBACK_HELP_CATEGORY_ICONS[cat];
      if (fallback !== undefined) {
        mutableHelpCategoryIcons[cat] = fallback;
      }
    }
  }

  for (const [digit, name] of NUMBER_EMOJI_NAMES) {
    const match = available.get(name.toLowerCase());
    if (match) {
      const tag = match.animated ? `<a:${match.name}:${match.id}>` : `<:${match.name}:${match.id}>`;
      mutableNumberEmojis[digit] = tag;
    } else {
      const fallback = FALLBACK_NUMBER_EMOJIS[digit];
      if (fallback !== undefined) {
        mutableNumberEmojis[digit] = fallback;
      }
    }
  }

  return {
    total: ALL_REQUIRED_EMOJI_NAMES.length,
    resolved,
    missing,
  };
}

export async function syncApplicationEmojis(client: Client): Promise<EmojiResolutionResult> {
  const application = client.application;
  if (!application) return resolveEmojis([]);

  const existing = await application.emojis.fetch().catch(() => null);
  const existingMap = new Map<string, { id: string; name: string; animated: boolean }>();

  if (existing) {
    for (const emoji of existing.values()) {
      if (emoji.name) {
        existingMap.set(emoji.name.toLowerCase(), {
          id: emoji.id,
          name: emoji.name,
          animated: emoji.animated ?? false,
        });
      }
    }
  }

  const missingList: FallbackEmojiData[] = [];
  for (const name of ALL_REQUIRED_EMOJI_NAMES) {
    if (!existingMap.has(name.toLowerCase())) {
      const def = FALLBACK_DEFINITIONS.get(name.toLowerCase());
      if (def) missingList.push(def);
    }
  }

  const missingBadges: { name: string; url: string }[] = [];
  for (const [badgeId, hash] of Object.entries(BADGE_ICON_HASHES)) {
    const name = `b_${badgeId}`.slice(0, 32);
    if (!existingMap.has(name.toLowerCase())) {
      missingBadges.push({ name, url: `https://cdn.discordapp.com/badge-icons/${hash}.png` });
    }
  }

  if (existing && missingBadges.length > 0) {
    console.log(`[Emoji Sync] Uploading ${missingBadges.length} missing badge emoji(s) to the bot...`);
    for (const badge of missingBadges) {
      try {
        const res = await fetch(badge.url).catch(() => null);
        if (!res || !res.ok) {
          console.warn(`[Emoji Sync] Failed to download :${badge.name}: (${badge.url})`);
          continue;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        await application.emojis.create({ attachment: buffer, name: badge.name });
        await sleep(350);
      } catch (error) {
        console.warn(`[Emoji Sync] Could not create badge emoji :${badge.name}::`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  if (existing && missingList.length > 0) {
    console.log(`[Emoji Sync] Uploading ${missingList.length} missing emoji(s) to the bot...`);
    for (const item of missingList) {
      const ext = item.animated ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/emojis/${item.id}.${ext}`;
      try {
        const res = await fetch(url).catch(() => null);
        if (!res || !res.ok) {
          console.warn(`[Emoji Sync] Failed to download :${item.name}: from CDN (${url})`);
          continue;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        const created = await application.emojis.create({ attachment: buffer, name: item.name });
        if (created.name) {
          existingMap.set(created.name.toLowerCase(), {
            id: created.id,
            name: created.name,
            animated: created.animated ?? false,
          });
        }
        await sleep(350);
      } catch (error) {
        console.warn(`[Emoji Sync] Could not create emoji :${item.name}::`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  return resolveEmojis(existingMap.values());
}
