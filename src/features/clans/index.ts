import { MessageFlags, type ButtonInteraction } from 'discord.js';
import config from '../../core/config';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { cachedColor } from '../theme/theme.model';
import { performClanAdd, performClanPromote } from './logic';
import { getClan, listClans } from './clans.model';
import {
  CLAN_INVITE_PREFIX,
  CLAN_INVITE_TTL_MS,
  CLAN_PROMOTE_PREFIX,
  CLAN_PROMOTE_TTL_MS,
  clanInviteCard,
  clanPromoteCard,
  clansListCard,
} from './clans.ui';

const CLANS_PAGE_CUSTOM_ID = /^clans:page:(\d{15,22}):(-?\d+)$/;

function accentFor(guildId: string | null): number {
  return (guildId ? cachedColor(guildId) : undefined) ?? config.color;
}

function notForYou(interaction: ButtonInteraction): Promise<unknown> {
  return interaction.reply({ content: "This isn't for you.", flags: MessageFlags.Ephemeral }).catch(() => undefined);
}

export const routes = [
  defineRoute<ButtonInteraction>({
    name: 'clans:invite',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(CLAN_INVITE_PREFIX),
    async handle(interaction) {
      const [action, clanId, targetId, createdAtRaw] = interaction.customId.slice(CLAN_INVITE_PREFIX.length).split(':');
      const createdAt = Number(createdAtRaw);
      if ((action !== 'accept' && action !== 'decline') || !clanId || !targetId || !Number.isFinite(createdAt)) return;
      if (interaction.user.id !== targetId) { await notForYou(interaction); return; }
      if (!interaction.guild) return;

      const accent = accentFor(interaction.guildId);
      const clanName = (await getClan(interaction.guild.id, clanId))?.name ?? 'that clan';
      const base = { clanId, targetId, inviterName: '', clanName, createdAt };

      if (Date.now() - createdAt > CLAN_INVITE_TTL_MS) {
        await interaction.update(clanInviteCard(accent, { ...base, status: 'expired' }));
        return;
      }
      if (action === 'decline') {
        await interaction.update(clanInviteCard(accent, { ...base, status: 'declined' }));
        return;
      }

      const problem = await performClanAdd(interaction.guild, clanId, targetId);
      await interaction.update(clanInviteCard(accent, { ...base, status: problem ? 'declined' : 'accepted' }));
    },
  }),
  defineRoute<ButtonInteraction>({
    name: 'clans:promote',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(CLAN_PROMOTE_PREFIX),
    async handle(interaction) {
      const [action, clanId, targetId, leaderId, createdAtRaw] = interaction.customId.slice(CLAN_PROMOTE_PREFIX.length).split(':');
      const createdAt = Number(createdAtRaw);
      if ((action !== 'confirm' && action !== 'cancel') || !clanId || !targetId || !leaderId || !Number.isFinite(createdAt)) return;
      if (interaction.user.id !== leaderId) { await notForYou(interaction); return; }
      if (!interaction.guild) return;

      const accent = accentFor(interaction.guildId);
      const clanName = (await getClan(interaction.guild.id, clanId))?.name ?? 'that clan';
      const base = { clanId, targetId, leaderId, clanName, createdAt };

      if (Date.now() - createdAt > CLAN_PROMOTE_TTL_MS) {
        await interaction.update(clanPromoteCard(accent, { ...base, status: 'expired' }));
        return;
      }
      if (action === 'cancel') {
        await interaction.update(clanPromoteCard(accent, { ...base, status: 'cancelled' }));
        return;
      }

      const problem = await performClanPromote(interaction.guild, clanId, targetId);
      await interaction.update(clanPromoteCard(accent, { ...base, status: problem ? 'cancelled' : 'confirmed' }));
    },
  }),
  defineRoute<ButtonInteraction>({
    name: 'clans:page',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && CLANS_PAGE_CUSTOM_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = CLANS_PAGE_CUSTOM_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, invokerId, pageText] = parsed as unknown as [string, string, string];

      if (interaction.user.id !== invokerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${invokerId}> can use these buttons.`));
        return;
      }
      const guild = interaction.guild ?? (interaction.guildId ? await interaction.client.guilds.fetch(interaction.guildId).catch(() => null) : null);
      if (!guild) return;

      const clans = (await listClans(guild.id)).sort((a, b) => a.name.localeCompare(b.name));
      await interaction.update(clansListCard(accentFor(interaction.guildId), guild.name, clans.map((clan) => ({
        id: clan.id,
        name: clan.name,
        memberCount: clan.memberIds.length + clan.coLeaderIds.length + 1,
        memberLimit: clan.memberLimit,
        leaderId: clan.leaderId,
        roleId: clan.roleId,
        warningsCount: clan.warnings.length,
        avatarUrl: clan.avatarUrl,
      })), Number(pageText), invokerId));
    },
  }),
];
