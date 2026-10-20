import { fail, requireGuild } from '../../../core/replies';
import type { CommandHandler } from '../../../core/types';
import { successReply } from '../../../core/usage-replies';
import { deleteClan as eraseClan, listClans, nextClanId, saveClan, type Clan } from '../clans.model';
import { refreshClanLeaderboard } from './service';

// Zero-width-space prefix marks seeded test clans so `seedclantest clean` can find and remove
// only them, without touching any real clan a server actually created.
const TEST_MARKER = '​';
const TEST_CLAN_SPECS: { name: string; targetHours: number; memberCount: number }[] = [
  { name: `${TEST_MARKER}Dragons`, targetHours: 2256, memberCount: 5 },
  { name: `${TEST_MARKER}Phoenix`, targetHours: 1542, memberCount: 4 },
  { name: `${TEST_MARKER}Shadow Wolves`, targetHours: 1023, memberCount: 3 },
  { name: `${TEST_MARKER}Iron Legion`, targetHours: 991, memberCount: 4 },
  { name: `${TEST_MARKER}Freedom`, targetHours: 838, memberCount: 2 },
  { name: `${TEST_MARKER}Titans`, targetHours: 712, memberCount: 3 },
  { name: `${TEST_MARKER}Ravens`, targetHours: 655, memberCount: 5 },
  { name: `${TEST_MARKER}Spartans`, targetHours: 540, memberCount: 2 },
  { name: `${TEST_MARKER}Nightfall`, targetHours: 467, memberCount: 4 },
  { name: `${TEST_MARKER}Crimson Blade`, targetHours: 389, memberCount: 3 },
  { name: `${TEST_MARKER}Silver Hawks`, targetHours: 301, memberCount: 2 },
  { name: `${TEST_MARKER}Obsidian`, targetHours: 215, memberCount: 3 },
];

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy.at(i);
    const b = copy.at(j);
    if (a === undefined || b === undefined) continue;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

export const clansSeedLogic = {
  async seedClanTest(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    if (!ctx.hasPermission('administrator')) return fail(ctx, 'Administrator permission is required.');

    const existing = await listClans(guild.id);
    const testClans = existing.filter((clan) => clan.name.startsWith(TEST_MARKER));
    for (const clan of testClans) await eraseClan(guild.id, clan.id);

    if ((ctx.args[0] ?? '').toLowerCase() === 'clean') {
      await refreshClanLeaderboard(guild);
      await ctx.send(successReply(ctx, `- Removed **${testClans.length}** test clan(s). Real members and roles were untouched.`));
      return 'completed';
    }

    const members = await guild.members.fetch();
    const humanMembers = [...members.values()].filter((member) => !member.user.bot);
    if (humanMembers.length < 2) return fail(ctx, 'The server needs at least 2 human members to generate a preview.');

    const realClanRoleIds = new Set(existing.filter((clan) => !testClans.includes(clan)).map((clan) => clan.roleId).filter((id): id is string => id !== null));
    const roles = await guild.roles.fetch();
    const usableRoles = shuffled([...roles.values()].filter((role) => role.id !== guild.id && !role.managed && !realClanRoleIds.has(role.id)));

    for (const [index, spec] of TEST_CLAN_SPECS.entries()) {
      const role = usableRoles.length ? usableRoles.at(index % usableRoles.length) : undefined;
      const memberCount = Math.min(spec.memberCount, humanMembers.length);
      const picked = shuffled(humanMembers).slice(0, memberCount);
      const [leader, ...rest] = picked;
      if (!leader) continue;

      const hoursMs: Record<string, number> = {};
      let remainingMs = spec.targetHours * 3_600_000;
      picked.forEach((member, memberIndex) => {
        const isLast = memberIndex === picked.length - 1;
        const ms = isLast ? remainingMs : Math.floor(remainingMs * (Math.random() * 0.5 + 0.15));
        hoursMs[member.id] = Math.max(0, ms);
        remainingMs -= ms;
      });

      const clan: Clan = {
        guildId: guild.id, id: await nextClanId(guild.id), name: spec.name,
        leaderId: leader.id, coLeaderIds: [], memberIds: rest.map((member) => member.id),
        roleId: role?.id ?? null, memberLimit: 50, coLeaderLimit: 3, hoursMs, warnings: [], createdAt: Date.now(),
      };
      await saveClan(clan);
    }

    await refreshClanLeaderboard(guild);
    await ctx.send(successReply(ctx, [
      `- Added **${TEST_CLAN_SPECS.length}** test clans using real members and roles.`,
      `- Run \`${ctx.prefix}top clans\` to preview the leaderboard.`,
      `- When done, run \`${ctx.prefix}seedclantest clean\` to remove them.`,
    ].join('\n')));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
