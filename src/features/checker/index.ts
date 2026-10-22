import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { findGuildAdmins, findGuildBots } from './adminAudit';
import {
  cacheTopmaPageUrl,
  fullCheckPage,
  listAdminsPage,
  listBotsPage,
  myServerBannerPage,
  rolesCheckPage,
  TOPMA_MYSERVER_BUTTON_ID,
  topVoicePage,
  voiceCheckPage,
} from './checker.ui';
import { getMutualGuilds } from './mutualGuilds';
import { oldMembersRoutes } from './oldMembers';
import { findVoiceLocations, getMyServerRank, getVoiceLeaderboard } from './voiceActivity';

const CUSTOM_ID = /^checker:(fc|cr|cv|la|lb):(\d{15,22}):(\d{15,22}):(-?\d+)$/;
const TOPMA_NAV_ID = /^checker:tm:(\d{15,22}):(-?\d+)$/;

export const routes = [
  ...oldMembersRoutes,
  defineRoute<ButtonInteraction>({
    name: 'checker:nav',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && CUSTOM_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = CUSTOM_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, kind, invokerId, targetId, indexText] = parsed as unknown as [string, 'fc' | 'cr' | 'cv' | 'la' | 'lb', string, string, string];

      if (interaction.user.id !== invokerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${invokerId}> can use these buttons.`));
        return;
      }

      const index = Number(indexText);

      if (kind === 'la') {
        const audit = await findGuildAdmins(interaction.client, targetId);
        if (!audit) {
          await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "I couldn't find that server anymore."));
          return;
        }
        await interaction.update(listAdminsPage(audit, index, invokerId));
        return;
      }

      if (kind === 'lb') {
        const audit = await findGuildBots(interaction.client, targetId);
        if (!audit) {
          await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "I couldn't find that server anymore."));
          return;
        }
        await interaction.update(listBotsPage(audit, index, invokerId));
        return;
      }

      const target = await interaction.client.users.fetch(targetId).catch(() => null);
      if (!target) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', "I couldn't find that user anymore."));
        return;
      }

      if (kind === 'fc') {
        const entries = await getMutualGuilds(interaction.client, target.id);
        await interaction.update(fullCheckPage(target, entries, index, invokerId));
      } else if (kind === 'cr') {
        const entries = await getMutualGuilds(interaction.client, target.id);
        const dangerous = entries.filter((entry) => entry.dangerous.length > 0);
        await interaction.update(rolesCheckPage(target, dangerous, index, invokerId));
      } else {
        const locations = await findVoiceLocations(interaction.client, target.id);
        await interaction.update(voiceCheckPage(target, locations, index, invokerId));
      }
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'checker:topma-myserver',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === TOPMA_MYSERVER_BUTTON_ID,
    async handle(interaction) {
      if (!interaction.guildId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Run this inside a server to see its rank.'));
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const guild = interaction.guild ?? (await interaction.client.guilds.fetch(interaction.guildId).catch(() => null));
      if (!guild) {
        await interaction.editReply(themedReplyFor(interaction.guildId, false, 'error', "This server isn't on the voice leaderboard right now."));
        return;
      }

      const { entry, rankNumber, totalRanked } = await getMyServerRank(interaction.client, guild);
      const page = await myServerBannerPage(entry, rankNumber, totalRanked);
      await interaction.editReply({
        ...page,
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'checker:topma-nav',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && TOPMA_NAV_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = TOPMA_NAV_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, invokerId, pageText] = parsed;

      if (interaction.user.id !== invokerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${invokerId}> can use these buttons.`));
        return;
      }

      await interaction.deferUpdate();
      const page = Number(pageText);
      const entries = await getVoiceLeaderboard(interaction.client);
      const pageData = await topVoicePage(entries, page, invokerId);
      const message = await interaction.editReply(pageData);
      cacheTopmaPageUrl(invokerId, pageData.page, message);
    },
  }),
];
