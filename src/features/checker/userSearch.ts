import type { Collection, Guild, GuildMember, User } from 'discord.js';
import type { Ctx } from '../../core/context';

interface NameLike {
  username: string;
  globalName: string | null;
  displayName: string;
}

function matchesExactly(candidate: NameLike, nickname: string | null, lower: string): boolean {
  return (
    candidate.username.toLowerCase() === lower ||
    candidate.globalName?.toLowerCase() === lower ||
    candidate.displayName.toLowerCase() === lower ||
    nickname?.toLowerCase() === lower
  );
}

function matchesPrefix(candidate: NameLike, lower: string): boolean {
  return candidate.username.toLowerCase().startsWith(lower) || candidate.displayName.toLowerCase().startsWith(lower);
}

function findInMembers(members: Collection<string, GuildMember>, lower: string): GuildMember | undefined {
  return members.find((member) => matchesExactly(member.user, member.nickname, lower));
}

async function fuzzyFetch(guild: Guild, query: string, lower: string): Promise<GuildMember | null> {
  const fetched = await guild.members.fetch({ query, limit: 5 }).catch(() => null);
  if (!fetched || fetched.size === 0) return null;
  return findInMembers(fetched, lower) ?? fetched.first() ?? null;
}

export async function resolveTarget(ctx: Ctx, index = 0): Promise<User | null> {
  const direct = await ctx.findUser(index);
  if (direct) return direct;

  const raw = (ctx.args[index] ?? '').trim().replace(/^@+/, '');
  if (!raw) return null;
  const lower = raw.toLowerCase();

  if (ctx.guild) {
    const member = findInMembers(ctx.guild.members.cache, lower);
    if (member) return member.user;
  }

  const cachedUser = ctx.client.users.cache.find((user) => matchesExactly(user, null, lower));
  if (cachedUser) return cachedUser;

  if (ctx.guild) {
    const fetched = await fuzzyFetch(ctx.guild, raw, lower);
    if (fetched) return fetched.user;
  }

  for (const guild of ctx.client.guilds.cache.values()) {
    if (guild.id === ctx.guild?.id) continue;
    const member = findInMembers(guild.members.cache, lower);
    if (member) return member.user;
  }

  const prefixMember = ctx.guild ? ctx.guild.members.cache.find((member) => matchesPrefix(member.user, lower)) : undefined;
  if (prefixMember) return prefixMember.user;

  return ctx.client.users.cache.find((user) => matchesPrefix(user, lower)) ?? null;
}
