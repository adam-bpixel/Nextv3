import type { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import config from '../../core/config';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { getGuildPrefix } from '../prefix/prefix.model';
import { STYLE_NAV_PREFIX, STYLE_SELECT_ID, parseStyleNavCustomId, styleHelpPayload, styleHelpStartIndex } from './style.ui';

export const routes = [
  defineRoute<StringSelectMenuInteraction>({
    name: 'guildprofile-style:select',
    match: (interaction): interaction is StringSelectMenuInteraction => interaction.isStringSelectMenu() && interaction.customId.startsWith(STYLE_SELECT_ID),
    async handle(interaction) {
      const ownerId = interaction.customId.slice(STYLE_SELECT_ID.length);
      if (interaction.user.id !== ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${ownerId}> can use this menu.`));
        return;
      }
      const [value] = interaction.values;
      if (value === undefined) return;
      const prefix = await getGuildPrefix(interaction.guildId);
      const botName = interaction.client.user?.username ?? config.botName;
      await interaction.update(styleHelpPayload(ownerId, botName, prefix, styleHelpStartIndex(value), interaction.guildId));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'guildprofile-style:nav',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(STYLE_NAV_PREFIX),
    async handle(interaction) {
      const parsed = parseStyleNavCustomId(interaction.customId);
      if (!parsed) return;
      if (interaction.user.id !== parsed.ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${parsed.ownerId}> can use these buttons.`));
        return;
      }
      const prefix = await getGuildPrefix(interaction.guildId);
      const botName = interaction.client.user?.username ?? config.botName;
      await interaction.update(styleHelpPayload(parsed.ownerId, botName, prefix, parsed.page, interaction.guildId));
    },
  }),
];
