import type { Guild } from 'discord.js';
import type { Ctx } from '../../core/context';
import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { guildTextChannel } from '../moderation/moderation.service';
import { roleSettingsOf, saveRoleSettings } from './roles.model';

const CHANNEL_REF = /^<#(\d{15,22})>$|^(\d{15,22})$/;
const OFF_WORDS = /^(off|none|clear)$/i;

async function logRoleChange(guild: Guild, content: string): Promise<void> {
  const settings = await roleSettingsOf(guild.id);
  if (!settings.roleLogsChannelId) return;
  const channel = await guild.channels.fetch(settings.roleLogsChannelId).catch(() => null);
  if (channel?.isTextBased() && channel.isSendable()) await channel.send({ content, allowedMentions: { parse: [] } }).catch(() => undefined);
}

export async function hasMoveAccess(ctx: Ctx): Promise<boolean> {
  if (ctx.hasPermission('move_members')) return true;
  if (!ctx.guild || !ctx.member) return false;
  const settings = await roleSettingsOf(ctx.guild.id);
  return Boolean(settings.moveRoleId && ctx.member.roles.cache.has(settings.moveRoleId));
}

export const rolesLogic = {
  async role(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const member = await ctx.targetMember(0);
    if (!member) return fail(ctx, `Mention the user or enter their ID.\nUse: \`${ctx.prefix}role <user mention or ID> <role ID or role name>\`.`);
    const roleArg = ctx.args[1]?.replace(/[<@&>]/g, '');
    if (!roleArg) return fail(ctx, `Give a role ID or role name.\nUse: \`${ctx.prefix}role <user mention or ID> <role ID or role name>\`.`);

    await guild.roles.fetch().catch(() => undefined);
    const role = guild.roles.cache.get(roleArg) ?? guild.roles.cache.find((r) => r.name.toLowerCase() === roleArg.toLowerCase());
    if (!role) return fail(ctx, "I couldn't find that role.");
    if (role.managed || role.id === guild.id) return fail(ctx, "That role can't be assigned manually.");

    const me = guild.members.me;
    if (!me?.permissions.has('ManageRoles')) return fail(ctx, 'I need the Manage Roles permission.');
    if (me.roles.highest.position <= role.position) return fail(ctx, "I can't manage a role positioned at or above my highest role.");

    const hadRole = member.roles.cache.has(role.id);
    const ok = hadRole
      ? await member.roles.remove(role).then(() => true, () => false)
      : await member.roles.add(role).then(() => true, () => false);
    if (!ok) return fail(ctx, "I couldn't change that role — check my permissions and role position.");

    await ctx.send(
      successReply(ctx, hadRole ? `- Removed **${role.name}** from **${member.user.username}**.` : `- Gave **${role.name}** to **${member.user.username}**.`),
    );
    await logRoleChange(
      guild,
      `${hadRole ? 'Removed' : 'Added'} role **${role.name}** ${hadRole ? 'from' : 'to'} **${member.user.tag}** by **${ctx.user.tag}**.`,
    );
    return 'completed';
  },

  async setmoverole(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const settings = await roleSettingsOf(guild.id);

    const raw = ctx.args[0];
    if (!raw) {
      await ctx.send(
        settings.moveRoleId
          ? successReply(ctx, `- Current move role: <@&${settings.moveRoleId}>.`)
          : errorReply(ctx, `No move role is configured.\nUse \`${ctx.prefix}setmoverole <role>\` to set one or \`${ctx.prefix}setmoverole off\` to clear it.`),
      );
      return 'completed';
    }

    if (OFF_WORDS.test(raw)) {
      await saveRoleSettings(guild.id, { ...settings, moveRoleId: null });
      await ctx.send(successReply(ctx, '- Cleared the move role.'));
      return 'completed';
    }

    const roleArg = raw.replace(/[<@&>]/g, '');
    await guild.roles.fetch().catch(() => undefined);
    const role = guild.roles.cache.get(roleArg) ?? guild.roles.cache.find((r) => r.name.toLowerCase() === roleArg.toLowerCase());
    if (!role) return fail(ctx, "I couldn't find that role.");

    await saveRoleSettings(guild.id, { ...settings, moveRoleId: role.id });
    await ctx.send(successReply(ctx, `- Members with **${role.name}** can now use move commands.`));
    return 'completed';
  },

  async setroleslogs(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const settings = await roleSettingsOf(guild.id);

    const raw = ctx.args[0];
    if (!raw) {
      await ctx.send(
        settings.roleLogsChannelId
          ? successReply(ctx, `- Current role logs channel: <#${settings.roleLogsChannelId}>.`)
          : errorReply(ctx, `No role logs channel is configured.\nUse \`${ctx.prefix}setroleslogs <channel>\` to set one or \`${ctx.prefix}setroleslogs off\` to clear it.`),
      );
      return 'completed';
    }

    if (OFF_WORDS.test(raw)) {
      await saveRoleSettings(guild.id, { ...settings, roleLogsChannelId: null });
      await ctx.send(successReply(ctx, '- Cleared the role logs channel.'));
      return 'completed';
    }

    const channelId = CHANNEL_REF.exec(raw)?.[1] ?? CHANNEL_REF.exec(raw)?.[2];
    const channel = channelId ? await guild.channels.fetch(channelId).catch(() => null) : null;
    if (!channel || !channel.isTextBased() || !channel.isSendable()) {
      return fail(ctx, `Mention a text channel I can send messages in.\nUse: \`${ctx.prefix}setroleslogs <channel>\`.`);
    }

    await saveRoleSettings(guild.id, { ...settings, roleLogsChannelId: channel.id });
    await ctx.send(successReply(ctx, `- Role change logs will be sent to <#${channel.id}>.`));
    return 'completed';
  },

  async unperminall(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const roleId = /\d{15,22}/.exec(ctx.args[0] ?? '')?.[0];
    if (!roleId) return fail(ctx, `Mention a role or enter its ID.\nUse: \`${ctx.prefix}unperminall <role ID>\`.`);
    const role = guild.roles.cache.get(roleId) ?? (await guild.roles.fetch(roleId).catch(() => null));
    if (!role) return fail(ctx, "I couldn't find that role.");
    const channel = guildTextChannel(ctx.channel);
    if (channel.isThread()) return fail(ctx, "I can't edit permissions in a thread — use this in a regular channel.");
    const overwrite = channel.permissionOverwrites.cache.get(role.id);
    if (!overwrite) {
      await ctx.send(successReply(ctx, `- **${role.name}** has no permission overwrite in ${channel}.`));
      return 'completed';
    }
    await channel.permissionOverwrites.edit(role, { SendMessages: null, Connect: null });
    const refreshed = channel.permissionOverwrites.cache.get(role.id);
    if (refreshed && refreshed.allow.bitfield === 0n && refreshed.deny.bitfield === 0n) {
      await channel.permissionOverwrites.delete(role).catch(() => undefined);
    }
    await ctx.send(successReply(ctx, `- Removed **${role.name}**'s send message and connect permissions in ${channel}.`));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
