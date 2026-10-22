import { ChannelType, ContainerBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../../../core/config';
import { fail, requireGuild } from '../../../core/replies';
import type { CommandHandler } from '../../../core/types';
import { successReply } from '../../../core/usage-replies';
import { getServerInviteURL, sep, serverLinkButtonRow, text, toPayload } from '../../setup/setup.ui.shared';
import { clanOf, deleteClan as eraseClan, getClan, listClans, nextClanId, rankOf, saveClan, settingsOf, type Clan } from '../clans.model';
import { assignRank, logClan, manager, memberArg, USER_ID } from './helpers';
import { refreshClanLeaderboard } from './service';

export const clansAdminLogic = {
  async clanCreate(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    if (!ctx.member || !(await manager(ctx, guild.id))) return 'skipped';
    if (!ctx.args[0]) return fail(ctx, `Give a leader (mention or ID) and a clan name.\nUse: \`${ctx.prefix}createclan <leader mention or ID> <name (3–32 characters)>\`.`);
    const leader = await memberArg(ctx); const name = ctx.args.slice(1).join(' ').trim();
    if (!leader) return fail(ctx, "I couldn't find that member in this server. Mention them or use their user ID.");
    if (leader.user.bot) return fail(ctx, "A bot can't lead a clan.");
    if (name.length < 3 || name.length > 32) return fail(ctx, `Enter a clan name between 3 and 32 characters.\nUse: \`${ctx.prefix}createclan <leader mention or ID> <name (3–32 characters)>\`.`);
    if (await clanOf(guild.id, leader.id)) return fail(ctx, 'That user already belongs to a clan.');
    const clans = await listClans(guild.id);
    if (clans.some((clan) => clan.name.toLowerCase() === name.toLowerCase())) return fail(ctx, 'A clan with that name already exists.');
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) return fail(ctx, 'I need Manage Roles permission to create clans.');
    const role = await guild.roles.create({ name: name.slice(0, 100), reason: `Clan ${name}` }).catch(() => null);
    if (!role) return fail(ctx, 'I could not create the clan role. Check my role position and permissions.');
    const id = await nextClanId(guild.id);
    const clan: Clan = { guildId: guild.id, id, name, leaderId: leader.id, coLeaderIds: [], memberIds: [], roleId: role.id, memberLimit: 50, coLeaderLimit: 3, hoursMs: {}, warnings: [], createdAt: Date.now() };
    const clanSettings = await settingsOf(guild.id);
    const voice = await guild.channels.create({ name: name.slice(0, 100), type: ChannelType.GuildVoice, parent: clanSettings.voiceCategoryId, permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
    ], reason: `Voice channel for clan ${name}` }).catch(() => null);
    if (voice) clan.voiceChannelId = voice.id;
    await saveClan(clan); await assignRank(leader, clan, 'leader');
    await logClan(guild, `Clan created: ${name} (ID ${id}), leader ${leader.user.tag}.`);
    await refreshClanLeaderboard(guild);
    await ctx.send(successReply(ctx, `- Created **${name}** (ID: \`${id}\`).\n- Leader: <@${leader.id}>\n- Role: <@&${role.id}>${voice ? `\n- Voice channel: <#${voice.id}>` : ''}`)); return 'completed';
  },

  async clanForceAdd(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    if (!(await manager(ctx, guild.id))) return 'skipped';
    const clan = ctx.args[0] ? await getClan(guild.id, ctx.args[0]) : null;
    const targetId = USER_ID.exec(ctx.args[1] ?? '')?.[1] ?? USER_ID.exec(ctx.args[1] ?? '')?.[2];
    const target = targetId ? await guild.members.fetch(targetId).catch(() => null) : null;
    if (!clan || !target || target.user.bot) return fail(ctx, `Give a valid clan ID and a user to add (mention or ID, not a bot).\nUse: \`${ctx.prefix}forceadd <clan ID> <user mention or ID>\`.`);
    const previous = await clanOf(guild.id, target.id);
    if (previous?.leaderId === target.id) return fail(ctx, 'A clan leader cannot be moved to another clan.');
    if (previous?.id === clan.id) return fail(ctx, 'That user already belongs to this clan.');
    if (clan.memberIds.length + clan.coLeaderIds.length + 1 >= clan.memberLimit) return fail(ctx, 'This clan has reached its member limit.');
    if (previous) {
      previous.memberIds = previous.memberIds.filter((id) => id !== target.id); previous.coLeaderIds = previous.coLeaderIds.filter((id) => id !== target.id); delete previous.hoursMs[target.id];
      await saveClan(previous); await assignRank(target, previous, null);
    }
    if (!clan.memberIds.includes(target.id) && !clan.coLeaderIds.includes(target.id) && clan.leaderId !== target.id) clan.memberIds.push(target.id);
    await saveClan(clan); await assignRank(target, clan, 'member');
    await ctx.send(successReply(ctx, `- Added <@${target.id}> to **${clan.name}**.`)); return 'completed';
  },

  async clanDelete(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    if (!(await manager(ctx, guild.id))) return 'skipped';
    const clan = ctx.args[0] ? await getClan(guild.id, ctx.args[0]) : null; if (!clan) return fail(ctx, `Give a valid clan ID.\nUse: \`${ctx.prefix}deleteclan <clan ID>\`.`);
    for (const id of [clan.leaderId, ...clan.coLeaderIds, ...clan.memberIds]) {
      const member = await guild.members.fetch(id).catch(() => null); if (member) await assignRank(member, clan, null);
    }
    if (clan.roleId) await guild.roles.delete(clan.roleId, 'Clan deleted').catch(() => undefined);
    if (clan.voiceChannelId) await guild.channels.delete(clan.voiceChannelId, 'Clan deleted').catch(() => undefined);
    await eraseClan(guild.id, clan.id); await logClan(guild, `Clan deleted: ${clan.name} (ID ${clan.id}) by ${ctx.user.tag}.`);
    await refreshClanLeaderboard(guild);
    await ctx.send(successReply(ctx, `- Deleted **${clan.name}** (ID: ${clan.id}).`)); return 'completed';
  },

  async clanEdit(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    if (!(await manager(ctx, guild.id))) return 'skipped';
    const clan = ctx.args[0] ? await getClan(guild.id, ctx.args[0]) : null;
    const action = (ctx.args[1] ?? '').toLowerCase(); const value = ctx.args.slice(2).join(' ').trim();
    if (!clan) return fail(ctx, `Give a valid clan ID.\nUse: \`${ctx.prefix}clanupdate <clan ID> <name|members|coleaders|tag|color|voice|avatar> <value>\`.`);
    if (action === 'name') {
      if (value.length < 3 || value.length > 32) return fail(ctx, 'Clan names must contain 3 to 32 characters.');
      if ((await listClans(guild.id)).some((item) => item.id !== clan.id && item.name.toLowerCase() === value.toLowerCase())) return fail(ctx, 'A clan with that name already exists.');
      clan.name = value;
      if (clan.roleId) await guild.roles.edit(clan.roleId, { name: value }).catch(() => undefined);
      if (clan.voiceChannelId) await guild.channels.edit(clan.voiceChannelId, { name: value.slice(0, 100) }).catch(() => undefined);
    } else if (action === 'members') {
      const limit = Number.parseInt(value, 10);
      if (!Number.isInteger(limit) || limit < clan.memberIds.length + clan.coLeaderIds.length + 1 || limit > 1000) return fail(ctx, 'Member limit must be at least the current member count and no more than 1000.');
      clan.memberLimit = limit;
    } else if (action === 'coleaders') {
      const limit = Number.parseInt(value, 10);
      if (!Number.isInteger(limit) || limit < clan.coLeaderIds.length || limit > 1000) return fail(ctx, 'Co-leader limit must be at least the current co-leader count and no more than 1000.');
      clan.coLeaderLimit = limit;
    } else if (action === 'tag') {
      const tagParts = ctx.args.slice(2);
      const position = /^(prefix|suffix)$/i.test(tagParts[tagParts.length - 1] ?? '') ? tagParts.pop()!.toLowerCase() as 'prefix' | 'suffix' : clan.tagPosition ?? 'prefix';
      const tag = tagParts.join(' ').trim();
      if (tag.length > 10) return fail(ctx, 'Clan tags can contain up to 10 characters.');
      if (clan.tag && clan.tag !== tag) {
        for (const id of [clan.leaderId, ...clan.coLeaderIds, ...clan.memberIds]) {
          const member = await guild.members.fetch(id).catch(() => null);
          if (!member) continue;
          let nickname = member.nickname ?? member.user.username;
          if (nickname.startsWith(`[${clan.tag}]`)) nickname = nickname.slice(clan.tag.length + 2).trim();
          if (nickname.endsWith(`[${clan.tag}]`)) nickname = nickname.slice(0, -(clan.tag.length + 2)).trim();
          await member.setNickname(nickname.slice(0, 32)).catch(() => undefined);
        }
      }
      if (tag) clan.tag = tag; else delete clan.tag;
      clan.tagPosition = position;
    } else if (action === 'color') {
      if (!/^#?[0-9a-f]{6}$/i.test(value)) return fail(ctx, 'Enter a hex color, for example `#5865F2`.');
      clan.color = value.startsWith('#') ? value : `#${value}`;
      if (clan.roleId) await guild.roles.edit(clan.roleId, { color: Number.parseInt(clan.color.slice(1), 16) }).catch(() => undefined);
    } else if (action === 'voice') {
      const id = USER_ID.exec(value)?.[1] ?? USER_ID.exec(value)?.[2];
      const channel = id ? await guild.channels.fetch(id).catch(() => null) : null;
      if (!channel || channel.type !== ChannelType.GuildVoice) return fail(ctx, `Give a valid voice channel ID.\nUse: \`${ctx.prefix}clanupdate ${clan.id} voice <voice channel ID>\`.`);
      clan.voiceChannelId = channel.id;
    } else if (action === 'avatar') {
      if (['off', 'none', 'remove'].includes(value.toLowerCase())) clan.avatarUrl = null;
      else {
        if (!/^https:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?$/i.test(value)) return fail(ctx, 'The avatar must be a direct link to a PNG, JPG, GIF, or WebP image.\nUse: `' + `${ctx.prefix}clanupdate ${clan.id} avatar <image URL|off>` + '`.');
        clan.avatarUrl = value;
      }
    } else return fail(ctx, `Say which setting to change: name, members, coleaders, tag, color, voice, or avatar.\nUse: \`${ctx.prefix}clanupdate ${clan.id} <name|members|coleaders|tag|color|voice|avatar> <value>\`.`);
    await saveClan(clan);
    if (action === 'tag') for (const id of [clan.leaderId, ...clan.coLeaderIds, ...clan.memberIds]) {
      const member = await guild.members.fetch(id).catch(() => null);
      if (member) await assignRank(member, clan, rankOf(clan, id));
    }
    await refreshClanLeaderboard(guild);
    await ctx.send(successReply(ctx, `- Updated **${clan.name}** (${action}).`)); return 'completed';
  },

  async clanEditSelf(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    const clan = await clanOf(guild.id, ctx.user.id);
    if (!clan) return fail(ctx, 'You are not in a clan.');
    if (rankOf(clan, ctx.user.id) !== 'leader') return fail(ctx, 'Only the clan leader can edit the clan.');
    const action = (ctx.args[0] ?? '').toLowerCase(); const value = ctx.args.slice(1).join(' ').trim();
    if (action === 'name') {
      if (value.length < 3 || value.length > 32) return fail(ctx, 'Clan names must contain 3 to 32 characters.');
      if ((await listClans(guild.id)).some((item) => item.id !== clan.id && item.name.toLowerCase() === value.toLowerCase())) return fail(ctx, 'A clan with that name already exists.');
      clan.name = value;
      if (clan.roleId) await guild.roles.edit(clan.roleId, { name: value }).catch(() => undefined);
      if (clan.voiceChannelId) await guild.channels.edit(clan.voiceChannelId, { name: value.slice(0, 100) }).catch(() => undefined);
    } else if (action === 'tag') {
      const tagParts = ctx.args.slice(1);
      const position = /^(prefix|suffix)$/i.test(tagParts[tagParts.length - 1] ?? '') ? tagParts.pop()!.toLowerCase() as 'prefix' | 'suffix' : clan.tagPosition ?? 'prefix';
      const tag = tagParts.join(' ').trim();
      if (tag.length > 10) return fail(ctx, 'Clan tags can contain up to 10 characters.');
      if (clan.tag && clan.tag !== tag) {
        for (const id of [clan.leaderId, ...clan.coLeaderIds, ...clan.memberIds]) {
          const member = await guild.members.fetch(id).catch(() => null);
          if (!member) continue;
          let nickname = member.nickname ?? member.user.username;
          if (nickname.startsWith(`[${clan.tag}]`)) nickname = nickname.slice(clan.tag.length + 2).trim();
          if (nickname.endsWith(`[${clan.tag}]`)) nickname = nickname.slice(0, -(clan.tag.length + 2)).trim();
          await member.setNickname(nickname.slice(0, 32)).catch(() => undefined);
        }
      }
      if (tag) clan.tag = tag; else delete clan.tag;
      clan.tagPosition = position;
    } else if (action === 'color') {
      if (!/^#?[0-9a-f]{6}$/i.test(value)) return fail(ctx, 'Enter a hex color, for example `#5865F2`.');
      clan.color = value.startsWith('#') ? value : `#${value}`;
      if (clan.roleId) await guild.roles.edit(clan.roleId, { color: Number.parseInt(clan.color.slice(1), 16) }).catch(() => undefined);
    } else if (action === 'avatar') {
      if (['off', 'none', 'remove'].includes(value.toLowerCase())) clan.avatarUrl = null;
      else {
        if (!/^https:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?$/i.test(value)) return fail(ctx, `The avatar must be a direct link to a PNG, JPG, GIF, or WebP image.\nUse: \`${ctx.prefix}editmyclan avatar <image URL|off>\`.`);
        clan.avatarUrl = value;
      }
    } else return fail(ctx, `Say which setting to change: name, tag, color, or avatar.\nUse: \`${ctx.prefix}editmyclan <name|tag|color|avatar> <value>\`.`);
    await saveClan(clan);
    if (action === 'tag') for (const id of [clan.leaderId, ...clan.coLeaderIds, ...clan.memberIds]) {
      const member = await guild.members.fetch(id).catch(() => null);
      if (member) await assignRank(member, clan, rankOf(clan, id));
    }
    await refreshClanLeaderboard(guild);
    await ctx.send(successReply(ctx, `- Updated **${clan.name}** (${action}).`)); return 'completed';
  },

  async clanClearWarnings(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    if (!(await manager(ctx, guild.id))) return 'skipped';
    const clan = ctx.args[0] ? await getClan(guild.id, ctx.args[0]) : null;
    if (!clan) return fail(ctx, `Give a valid clan ID.\nUse: \`${ctx.prefix}clearwarnclan <clan ID>\`.`);
    const count = clan.warnings.length; clan.warnings = []; await saveClan(clan);
    await ctx.send(successReply(ctx, `- Cleared **${count}** warnings from **${clan.name}**.`)); return 'completed';
  },

  async clanWarn(ctx) {
    const guild = await requireGuild(ctx); if (!guild) return 'skipped';
    if (!(await manager(ctx, guild.id))) return 'skipped';
    const clan = ctx.args[0] ? await getClan(guild.id, ctx.args[0]) : null; if (!clan) return fail(ctx, `Give a valid clan ID.\nUse: \`${ctx.prefix}warnclan <clan ID> <reason>\`.`);
    const reason = ctx.args.slice(1).join(' ').trim(); if (!reason) return fail(ctx, `Give a reason for the warning.\nUse: \`${ctx.prefix}warnclan ${clan.id} <reason>\`.`);
    clan.warnings.push({ by: ctx.user.id, reason, at: Date.now() }); await saveClan(clan);
    await logClan(guild, `Clan warning: ${clan.name} (ID ${clan.id}) - ${reason} - issued by ${ctx.user.tag}.`);
    const inviteURL = await getServerInviteURL(guild);
    const warnContainer = new ContainerBuilder()
      .setAccentColor(config.color)
      .addTextDisplayComponents(text('## Clan Warning'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(text(`- __Your clan__ **${clan.name}** __received a warning :__\n- ${reason}`));
    if (inviteURL) warnContainer.addSeparatorComponents(sep()).addActionRowComponents(serverLinkButtonRow(guild.name, inviteURL));
    const warnPayload = toPayload(warnContainer);
    for (const id of [clan.leaderId, ...clan.coLeaderIds]) { const user = await ctx.client.users.fetch(id).catch(() => null); if (user) await user.send(warnPayload).catch(() => undefined); }
    await ctx.send(successReply(ctx, `- Added a warning to **${clan.name}**.`)); return 'completed';
  },
} satisfies Record<string, CommandHandler>;
