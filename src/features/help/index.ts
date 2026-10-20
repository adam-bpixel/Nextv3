import type { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { asBotClient } from '../../core/client';
import { defineRoute } from '../../core/types';
import { HELP_NAV_PREFIX, HELP_SELECT_ID, helpCategory, parseHelpNavCustomId } from './help.ui';
import { getGuildPrefix } from '../prefix/prefix.model';
import { themedReplyFor } from '../../core/usage-replies';

export const routes = [
  defineRoute<StringSelectMenuInteraction>({
    name: 'help:select',
    match: (interaction): interaction is StringSelectMenuInteraction => interaction.isStringSelectMenu() && interaction.customId.startsWith(HELP_SELECT_ID),
    async handle(interaction) {
      const ownerId = interaction.customId.slice(HELP_SELECT_ID.length);
      if (interaction.user.id !== ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${ownerId}> can use this menu.`));
        return;
      }
      const [value] = interaction.values;
      if (value === undefined) return;
      const prefix = await getGuildPrefix(interaction.guildId);
      await interaction.update(helpCategory(asBotClient(interaction.client), value, interaction.guildId, prefix, interaction.user.id));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'help:nav',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(HELP_NAV_PREFIX),
    async handle(interaction) {
      const parsed = parseHelpNavCustomId(interaction.customId);
      if (!parsed) return;
      if (interaction.user.id !== parsed.ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${parsed.ownerId}> can use these buttons.`));
        return;
      }
      const prefix = await getGuildPrefix(interaction.guildId);
      await interaction.update(
        helpCategory(asBotClient(interaction.client), parsed.value, interaction.guildId, prefix, interaction.user.id, parsed.page),
      );
    },
  }),
];
