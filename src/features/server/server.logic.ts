import { AuditLogEvent, ContainerBuilder, PermissionFlagsBits } from 'discord.js';
import { asBotClient } from '../../core/client';
import config from '../../core/config';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { sep, text, toPayload } from '../setup/setup.ui.shared';
import { settingsOf as clanSettingsOf } from '../clans/clans.model';
import { getGuildPrefix } from '../prefix/prefix.model';
import { cachedColor } from '../theme/theme.model';
import { getGuildSetup } from '../setup/setup.model.core';
import { isBlacklistedChannel } from '../setup/setup.model.blacklist';
import { getGuildSecurity } from '../security/security.model';
import {
  disableCommandFor,
  enableCommandFor,
  getAliasMap,
  getCooldownOverride,
  getCooldownOverrides,
  getDisabledCommands,
  removeAlias,
  removeCooldownOverride,
  resetCooldownOverrides,
  setAlias,
  setCooldownOverride,
} from './server.model';

function canManage(ctx: Parameters<CommandHandler>[0]): boolean {
  return ctx.hasPermission('manage_guild') || ctx.hasPermission('administrator');
}

async function needsManage(ctx: Parameters<CommandHandler>[0]) {
  if (!canManage(ctx)) {
    await ctx.send(errorReply(ctx, "You need the **Manage Server** permission to use this command."));
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// addemoji
// ---------------------------------------------------------------------------

const CUSTOM_EMOJI = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/;
const IMAGE_URL = /^https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?$/i;
const EMOJI_NAME = /^[a-zA-Z0-9_]{2,32}$/;

async function addEmoji(ctx: Parameters<CommandHandler>[0]) {
  const guild = await requireGuild(ctx); if (!guild) return 'skipped' as const;
  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuildExpressions)) {
    return fail(ctx, "I need the **Manage Expressions** permission to add emojis here.");
  }
  const source = ctx.args[0];
  if (!source) return fail(ctx, `Give a custom emoji or a direct image URL.\nUse: \`${ctx.prefix}addemoji <emoji or image URL> [name]\`.`);

  const customMatch = CUSTOM_EMOJI.exec(source);
  let attachment: string;
  let name = ctx.args[1];
  if (customMatch) {
    const [, emojiName, emojiId] = customMatch;
    const animated = source.startsWith('<a:');
    attachment = `https://cdn.discordapp.com/emojis/${emojiId}.${animated ? 'gif' : 'png'}?size=1024`;
    name = name ?? emojiName;
  } else if (IMAGE_URL.test(source)) {
    attachment = source;
    name = name ?? `emoji_${Date.now().toString(36)}`;
  } else {
    return fail(ctx, "That's not a custom emoji or a direct image URL (png, jpg, gif, webp).");
  }

  if (!name || !EMOJI_NAME.test(name)) {
    return fail(ctx, 'The emoji name must be 2–32 characters: letters, numbers, and underscores only.');
  }

  const created = await guild.emojis.create({ attachment, name }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return message;
  });

  if (typeof created === 'string') {
    const full = /maximum number of emojis/i.test(created)
      ? "This server has reached its custom emoji slot limit. Remove an emoji before adding another."
      : `Couldn't add that emoji: ${created.slice(0, 300)}`;
    return fail(ctx, full);
  }

  await ctx.send(successReply(ctx, `- Added emoji ${created}  as \`${created.name}\`.`));
  return 'completed' as const;
}

// ---------------------------------------------------------------------------
// alias
// ---------------------------------------------------------------------------

async function aliasManage(ctx: Parameters<CommandHandler>[0]) {
  const guild = await requireGuild(ctx); if (!guild) return 'skipped' as const;
  if (!(await needsManage(ctx))) return 'skipped' as const;
  const action = (ctx.args[0] ?? '').toLowerCase();
  const client = asBotClient(ctx.client);

  if (action === 'list') {
    const map = await getAliasMap(guild.id);
    const entries = Object.entries(map);
    if (!entries.length) return fail(ctx, `No custom aliases configured.\nUse: \`${ctx.prefix}alias add <command> <alias>\` to add one.`);
    const lines = entries.map(([alias, real]) => `- \`${alias}\` -> \`${real}\``).join('\n');
    await ctx.send(successReply(ctx, `Custom aliases for this server:\n${lines}`));
    return 'completed' as const;
  }

  if (action === 'add') {
    const commandName = (ctx.args[1] ?? '').toLowerCase();
    const alias = (ctx.args[2] ?? '').toLowerCase();
    if (!commandName || !alias) return fail(ctx, `Give a command and an alias.\nUse: \`${ctx.prefix}alias add <command> <alias>\`.`);
    if (!client.commands.has(commandName)) return fail(ctx, `\`${commandName}\` isn't a known command.`);
    if (client.commands.has(alias)) return fail(ctx, `\`${alias}\` is already a real command name and can't be used as an alias.`);
    await setAlias(guild.id, alias, commandName);
    await ctx.send(successReply(ctx, `- \`${ctx.prefix}${alias}\` now runs \`${ctx.prefix}${commandName}\`.`));
    return 'completed' as const;
  }

  if (action === 'remove') {
    const alias = (ctx.args[1] ?? '').toLowerCase();
    if (!alias) return fail(ctx, `Give the alias to remove.\nUse: \`${ctx.prefix}alias remove <alias>\`.`);
    const removed = await removeAlias(guild.id, alias);
    if (!removed) return fail(ctx, `\`${alias}\` isn't a configured alias.`);
    await ctx.send(successReply(ctx, `- Removed alias \`${alias}\`.`));
    return 'completed' as const;
  }

  return fail(ctx, `Say \`add\`, \`remove\`, or \`list\`.\nUse: \`${ctx.prefix}alias <add|remove|list> [command] [alias]\`.`);
}

// ---------------------------------------------------------------------------
// audituser
// ---------------------------------------------------------------------------

async function auditUser(ctx: Parameters<CommandHandler>[0]) {
  const guild = await requireGuild(ctx); if (!guild) return 'skipped' as const;
  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
    return fail(ctx, "I need the **View Audit Log** permission to use this command.");
  }
  const target = await ctx.findUser(0);
  if (!target) return fail(ctx, `Give a user (mention or ID).\nUse: \`${ctx.prefix}audituser <user mention or ID>\`.`);

  const logs = await guild.fetchAuditLogs({ limit: 100 }).catch(() => null);
  if (!logs) return fail(ctx, "Couldn't fetch this server's audit log.");

  const relevant = [...logs.entries.values()]
    .filter((entry) => entry.executorId === target.id || entry.targetId === target.id)
    .slice(0, 10);

  if (!relevant.length) {
    await ctx.send(successReply(ctx, `# Audit History for ${target.tag} (${target.id})\nNo recent audit-log entries involve that user.`));
    return 'completed' as const;
  }

  const lines = relevant.map((entry) => {
    const action = AuditLogEvent[entry.action] ?? `Action ${entry.action}`;
    const role = entry.executorId === target.id ? 'executor' : 'target';
    const other = role === 'executor' ? entry.targetId ?? 'unknown' : entry.executorId ?? 'unknown';
    const when = entry.createdTimestamp ? `<t:${Math.floor(entry.createdTimestamp / 1000)}:R>` : 'unknown time';
    return `- **${action}** — as **${role}** (${role === 'executor' ? 'target' : 'executor'}: <@${other}>) — ${when}${entry.reason ? `\n  -# ${entry.reason}` : ''}`;
  }).join('\n');

  await ctx.send(successReply(ctx, `# Audit History for ${target.tag} (${target.id})\n${lines}`));
  return 'completed' as const;
}

// ---------------------------------------------------------------------------
// cmdtimeout
// ---------------------------------------------------------------------------

async function cmdTimeout(ctx: Parameters<CommandHandler>[0]) {
  const guild = await requireGuild(ctx); if (!guild) return 'skipped' as const;
  if (!(await needsManage(ctx))) return 'skipped' as const;
  const action = (ctx.args[0] ?? '').toLowerCase();
  const client = asBotClient(ctx.client);

  if (action === 'list') {
    const overrides = await getCooldownOverrides(guild.id);
    const entries = Object.entries(overrides);
    if (!entries.length) return fail(ctx, `No custom command cooldowns configured.\nUse: \`${ctx.prefix}cmdtimeout set <command> <seconds>\`.`);
    const lines = entries.map(([name, seconds]) => `- \`${name}\`: ${seconds}s`).join('\n');
    await ctx.send(successReply(ctx, `Custom command cooldowns for this server:\n${lines}`));
    return 'completed' as const;
  }

  if (action === 'check') {
    const commandName = (ctx.args[1] ?? '').toLowerCase();
    if (!commandName) return fail(ctx, `Give a command.\nUse: \`${ctx.prefix}cmdtimeout check <command>\`.`);
    const command = client.commands.get(commandName);
    if (!command) return fail(ctx, `\`${commandName}\` isn't a known command.`);
    const override = await getCooldownOverride(guild.id, commandName);
    await ctx.send(successReply(ctx, `- __Command:__ \`${commandName}\`\n- __Default cooldown:__ ${command.cooldown}s\n- __Server override:__ ${override === null ? 'None' : `${override}s`}`));
    return 'completed' as const;
  }

  if (action === 'set') {
    const commandName = (ctx.args[1] ?? '').toLowerCase();
    const seconds = Number.parseInt(ctx.args[2] ?? '', 10);
    if (!commandName || !Number.isInteger(seconds) || seconds < 0 || seconds > 86400) {
      return fail(ctx, `Give a command and a duration in seconds (0–86400).\nUse: \`${ctx.prefix}cmdtimeout set <command> <duration>\`.`);
    }
    if (!client.commands.has(commandName)) return fail(ctx, `\`${commandName}\` isn't a known command.`);
    await setCooldownOverride(guild.id, commandName, seconds);
    await ctx.send(successReply(ctx, `- Set \`${commandName}\`'s cooldown to **${seconds}s** for this server.`));
    return 'completed' as const;
  }

  if (action === 'remove') {
    const commandName = (ctx.args[1] ?? '').toLowerCase();
    if (!commandName) return fail(ctx, `Give a command.\nUse: \`${ctx.prefix}cmdtimeout remove <command>\`.`);
    const removed = await removeCooldownOverride(guild.id, commandName);
    if (!removed) return fail(ctx, `\`${commandName}\` doesn't have a custom cooldown.`);
    await ctx.send(successReply(ctx, `- Removed the custom cooldown for \`${commandName}\`.`));
    return 'completed' as const;
  }

  if (action === 'reset') {
    const count = await resetCooldownOverrides(guild.id);
    await ctx.send(successReply(ctx, `- Reset **${count}** custom command cooldown${count === 1 ? '' : 's'} for this server.`));
    return 'completed' as const;
  }

  return fail(ctx, `Say \`check\`, \`list\`, \`set\`, \`remove\`, or \`reset\`.\nUse: \`${ctx.prefix}cmdtimeout <check|list|set|remove|reset> [command] [duration]\`.`);
}

// ---------------------------------------------------------------------------
// config
// ---------------------------------------------------------------------------

async function serverConfig(ctx: Parameters<CommandHandler>[0]) {
  const guild = await requireGuild(ctx); if (!guild) return 'skipped' as const;
  const [prefix, setup, security, clanSettings] = await Promise.all([
    getGuildPrefix(guild.id),
    getGuildSetup(guild.id),
    getGuildSecurity(guild.id),
    clanSettingsOf(guild.id),
  ]);

  const notSet = 'Not set';
  const disabled = await getDisabledCommands(guild.id);
  const color = cachedColor(guild.id);

  const container = new ContainerBuilder()
    .setAccentColor(color ?? config.color)
    .addTextDisplayComponents(text(`## Server Configuration — ${guild.name}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(
      `**Prefix:** \`${prefix}\`\n` +
      `**Anti-Bot System:** ${security.antibots ? 'Enabled' : 'Disabled'}\n` +
      `**Anti-Link System:** ${security.antilink ? 'Enabled' : 'Disabled'}\n` +
      `**Theme Color:** ${color !== undefined ? `#${color.toString(16).padStart(6, '0')}` : notSet}`,
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(
      `**Verification Settings**\n` +
      `**Verified Role:** ${setup.verification.verifiedRoleId ? `<@&${setup.verification.verifiedRoleId}>` : notSet}\n` +
      `**Unverified Role:** ${setup.verification.unverifiedRoleId ? `<@&${setup.verification.unverifiedRoleId}>` : notSet}\n` +
      `**Verification Logs:** ${setup.verification.logsChannelId ? `<#${setup.verification.logsChannelId}>` : notSet}`,
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(
      `**Clan Settings**\n` +
      `**Leader Role:** ${clanSettings.leaderRoleId ? `<@&${clanSettings.leaderRoleId}>` : notSet}\n` +
      `**Clan Logs:** ${clanSettings.logChannelId ? `<#${clanSettings.logChannelId}>` : notSet}\n` +
      `**Leaderboard Channel:** ${clanSettings.leaderboardChannelId ? `<#${clanSettings.leaderboardChannelId}>` : notSet}`,
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(
      `**Other**\n` +
      `**Blacklisted Channels:** ${setup.blacklistedChannelIds?.length ? setup.blacklistedChannelIds.length : 'None'}\n` +
      `**Disabled Commands:** ${disabled.length ? disabled.map((name) => `\`${name}\``).join(', ') : 'None'}\n` +
      `**Auto Role System:** ${setup.autoRoleIds?.length ? `${setup.autoRoleIds.length} role(s)` : 'Disabled'}\n` +
      `**Voice Count System:** ${setup.voiceCount?.enabled ? 'Enabled' : 'Disabled'}`,
    ))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(
      `-# Use \`${prefix}verifpanel\`, \`${prefix}clansetup\`, \`${prefix}prefix\`, or \`${prefix}theme\` to change these settings.`,
    ));

  await ctx.send(toPayload(container));
  return 'completed' as const;
}

// ---------------------------------------------------------------------------
// disabledcmd
// ---------------------------------------------------------------------------

async function disabledCmd(ctx: Parameters<CommandHandler>[0]) {
  const guild = await requireGuild(ctx); if (!guild) return 'skipped' as const;
  if (!(await needsManage(ctx))) return 'skipped' as const;
  const action = (ctx.args[0] ?? '').toLowerCase();
  const client = asBotClient(ctx.client);

  if (action === 'list') {
    const disabled = await getDisabledCommands(guild.id);
    if (!disabled.length) return fail(ctx, `No commands are disabled in this server.\nUse: \`${ctx.prefix}disabledcmd disable <command name>\`.`);
    await ctx.send(successReply(ctx, `Disabled commands in this server:\n${disabled.map((name) => `- \`${name}\``).join('\n')}`));
    return 'completed' as const;
  }

  if (action === 'disable') {
    const commandName = (ctx.args[1] ?? '').toLowerCase();
    if (!commandName) return fail(ctx, `Give a command name.\nUse: \`${ctx.prefix}disabledcmd disable <command name>\`.`);
    if (!client.commands.has(commandName)) return fail(ctx, `\`${commandName}\` isn't a known command.`);
    if (commandName === 'disabledcmd') return fail(ctx, "You can't disable this command.");
    const changed = await disableCommandFor(guild.id, commandName);
    if (!changed) return fail(ctx, `\`${commandName}\` is already disabled.`);
    await ctx.send(successReply(ctx, `- Disabled \`${commandName}\` in this server.`));
    return 'completed' as const;
  }

  if (action === 'enable') {
    const commandName = (ctx.args[1] ?? '').toLowerCase();
    if (!commandName) return fail(ctx, `Give a command name.\nUse: \`${ctx.prefix}disabledcmd enable <command name>\`.`);
    const changed = await enableCommandFor(guild.id, commandName);
    if (!changed) return fail(ctx, `\`${commandName}\` isn't disabled.`);
    await ctx.send(successReply(ctx, `- Re-enabled \`${commandName}\` in this server.`));
    return 'completed' as const;
  }

  return fail(ctx, `Say \`disable\`, \`enable\`, or \`list\`.\nUse: \`${ctx.prefix}disabledcmd <disable|enable|list> [command name]\`.`);
}

// ---------------------------------------------------------------------------
// find
// ---------------------------------------------------------------------------

async function findMember(ctx: Parameters<CommandHandler>[0]) {
  const guild = await requireGuild(ctx); if (!guild) return 'skipped' as const;
  if (!ctx.args[0]) return fail(ctx, `Give a member (mention, ID, or name).\nUse: \`${ctx.prefix}find <member>\`.`);

  let member = await ctx.targetMember(0);
  if (!member) {
    const query = ctx.args.join(' ').toLowerCase();
    await guild.members.fetch().catch(() => undefined);
    member = guild.members.cache.find((candidate) =>
      candidate.user.username.toLowerCase().includes(query) ||
      candidate.nickname?.toLowerCase().includes(query) ||
      candidate.displayName.toLowerCase().includes(query),
    ) ?? null;
  }
  if (!member) return fail(ctx, "I couldn't find that member in this server.");

  const channel = member.voice.channel;
  if (!channel) {
    await ctx.send(successReply(ctx, `# Not In Voice Channel\n\`${member.displayName}\` is not in a voice channel.`));
    return 'completed' as const;
  }

  await ctx.send(successReply(ctx, `# Found In Voice Channel\n\`${member.displayName}\` is in **${channel.name}** (<#${channel.id}>).\n- __Members in channel:__ ${channel.members.size}`));
  return 'completed' as const;
}

export const serverLogic = {
  addEmoji: addEmoji,
  aliasManage: aliasManage,
  auditUser: auditUser,
  cmdTimeout: cmdTimeout,
  serverConfig: serverConfig,
  disabledCmd: disabledCmd,
  findMember: findMember,
} satisfies Record<string, CommandHandler>;
