import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { fullCheckPage, rolesCheckPage, TOPMA_MYSERVER_BUTTON_ID, voiceCheckPage } from './checker.ui';
import { getMutualGuilds } from './mutualGuilds';
import { findVoiceLocations, getVoiceLeaderboard } from './voiceActivity';

const CUSTOM_ID = /^checker:(fc|cr|cv):(\d{15,22}):(\d{15,22}):(-?\d+)$/;

export const routes = [
  defineRoute<ButtonInteraction>({
    name: 'checker:nav',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && CUSTOM_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = CUSTOM_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, kind, invokerId, targetId, indexText] = parsed as unknown as [string, 'fc' | 'cr' | 'cv', string, string, string];

      if (interaction.user.id !== invokerId) {
        await interaction.reply({ content: `Only <@${invokerId}> can use these buttons.`, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
        return;
      }

      const target = await interaction.client.users.fetch(targetId).catch(() => null);
      if (!target) {
        await interaction.reply({ content: "I couldn't find that user anymore.", flags: MessageFlags.Ephemeral });
        return;
      }

      const index = Number(indexText);

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
        await interaction.reply({ content: 'Run this inside a server to see its rank.', flags: MessageFlags.Ephemeral });
        return;
      }

      const entries = await getVoiceLeaderboard(interaction.client);
      const inVoice = entries.filter((entry) => entry.voice > 0);
      const rank = inVoice.findIndex((entry) => entry.id === interaction.guildId);
      const entry = inVoice.at(rank);

      if (rank === -1 || !entry) {
        await interaction.reply({ content: "This server isn't on the voice leaderboard right now.", flags: MessageFlags.Ephemeral });
        return;
      }

      await interaction.reply({
        content: `**${entry.name}** is ranked **#${rank + 1}** of ${inVoice.length}, with **${entry.voice}** member(s) in voice.`,
        flags: MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    },
  }),
];
