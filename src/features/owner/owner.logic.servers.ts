import { ComponentType, MessageFlags } from 'discord.js';
import { claimMessage, releaseMessage } from '../../core/collectorClaims';
import config from '../../core/config';
import { requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { errorReply, successReply } from '../../core/usage-replies';
import { cachedColor } from '../theme/theme.model';
import { resetDataCustomId, resetDataPrompt, resetDataResult } from './resetData.ui';
import { clearGuildData, clearGuildDataFor, isResetDataTarget } from './serverData.model';
import { serversListCard } from './serversList.ui';
import { validId, usageFailure } from './owner.logic.helpers';

export const ownerServersLogic = {
  async ownerClearData(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const isGuildOwner = guild.ownerId === ctx.user.id;
    const isBotOwner = ctx.user.id === config.ownerId;
    if (!isGuildOwner && !isBotOwner) {
      await ctx.send(errorReply(ctx, 'Only the server owner can use this command.'));
      return 'skipped';
    }
    if (ctx.args[0]?.toLowerCase() !== 'confirm') {
      return usageFailure(ctx, `This permanently deletes all moderation, leveling, setup, and other server data for **${guild.name}**.\nUse: \`${ctx.prefix}cleardata confirm\` to proceed.`);
    }
    const cleared = await clearGuildData(guild.id);
    await ctx.send(successReply(ctx, `- Cleared **${cleared}** stored record(s) for **${guild.name}**.`));
    return 'completed';
  },

  async resetData(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const target = ctx.args[0]?.toLowerCase();
    if (!isResetDataTarget(target)) {
      return usageFailure(ctx, `Say which data to reset: \`verif\`, \`clans\`, or \`top\`.\nUse: \`${ctx.prefix}resetdata <verif|clans|top>\`.`);
    }
    const botMember = guild.members.me;
    if (!ctx.member || !botMember) {
      await ctx.send(errorReply(ctx, "I couldn't check role positions here."));
      return 'skipped';
    }
    if (!ctx.member.permissions.has('Administrator')) {
      await ctx.send(errorReply(ctx, 'You need Administrator permission to reset data.'));
      return 'skipped';
    }
    if (ctx.member.roles.highest.position <= botMember.roles.highest.position) {
      await ctx.send(errorReply(ctx, 'Your highest role must be above mine to reset data.'));
      return 'skipped';
    }

    const accent = cachedColor(guild.id) ?? config.color;
    const message = await ctx.send(resetDataPrompt(accent, guild.name, target, ctx.user.id));
    claimMessage(message.id);
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30_000 });

    collector.on('collect', (interaction) => {
      void (async () => {
        if (interaction.user.id !== ctx.user.id) {
          await interaction.reply({ content: "This isn't your confirmation.", flags: MessageFlags.Ephemeral }).catch(() => undefined);
          return;
        }
        const confirmed = interaction.customId === resetDataCustomId('confirm', target, ctx.user.id);
        collector.stop(confirmed ? 'confirmed' : 'cancelled');
        if (confirmed) {
          const cleared = await clearGuildDataFor(guild.id, target);
          await interaction.update(resetDataResult(accent, target, 'confirmed', cleared)).catch(() => undefined);
        } else {
          await interaction.update(resetDataResult(accent, target, 'cancelled')).catch(() => undefined);
        }
      })();
    });

    collector.on('end', (_collected, reason) => {
      releaseMessage(message.id);
      if (reason === 'confirmed' || reason === 'cancelled') return;
      message.edit(resetDataResult(accent, target, 'expired')).catch(() => undefined);
    });

    return 'completed';
  },

  async ownerServers(ctx) {
    const guilds = [...ctx.client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
    const accent = (ctx.guild ? cachedColor(ctx.guild.id) : undefined) ?? config.color;
    await ctx.send(serversListCard(accent, guilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      iconURL: guild.iconURL({ size: 128 }),
      memberCount: guild.memberCount,
      ownerId: guild.ownerId,
    })), 0, ctx.user.id));
    return 'completed';
  },

  async ownerLeaveServer(ctx) {
    const id = ctx.args[0]?.replace(/[<#>]/g, '');
    if (!id || !validId.test(id)) return usageFailure(ctx, `Give a valid server ID.\nUse: \`${ctx.prefix}leaveserver <server ID>\`.`);
    const guild = ctx.client.guilds.cache.get(id);
    if (!guild) {
      await ctx.send(errorReply(ctx, `I am not in a server with ID \`${id}\`.`));
      return 'skipped';
    }
    await ctx.send(successReply(ctx, `- Leaving **${guild.name}** (\`${guild.id}\`).`));
    await guild.leave();
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
