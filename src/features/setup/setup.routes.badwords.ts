import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { MAX_BAD_WORDS, addBadWords, getBadWords, removeBadWords } from '../badwords/badwords.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_BADWORDS_ADD_BUTTON,
  SETUP_BADWORDS_ADD_MODAL,
  SETUP_BADWORDS_BUTTON,
  SETUP_BADWORDS_REMOVE_BUTTON,
  SETUP_BADWORDS_REMOVE_MODAL,
  badWordsView,
  buildBadWordsAddModal,
  buildBadWordsRemoveModal,
} from './setup.ui.badwords';

async function deny(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<boolean> {
  if (hasManageGuild(interaction)) return false;
  await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
  return true;
}

export const badWordsRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:badwords:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_BADWORDS_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_BADWORDS_BUTTON);
      if (!ownerId || (await rejectOtherUser(interaction, ownerId))) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (await deny(interaction)) return;
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply(badWordsView(await getBadWords(guild.id)));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:badwords:add:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_BADWORDS_ADD_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await deny(interaction)) return;
      const remaining = MAX_BAD_WORDS - (await getBadWords(guild.id)).length;
      if (remaining <= 0) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `You can add up to ${MAX_BAD_WORDS} words.`));
        return;
      }
      await interaction.showModal(buildBadWordsAddModal(remaining));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:badwords:add:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_BADWORDS_ADD_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await deny(interaction)) return;
      await interaction.deferUpdate();
      const raw = interaction.fields.getTextInputValue('words').split(/[,\n،]+/).map((word) => word.trim()).filter(Boolean);
      const result = await addBadWords(guild.id, raw);
      await interaction.editReply(badWordsView(await getBadWords(guild.id)));
      const problems: string[] = [];
      if (result.tooLong.length) problems.push(`These words are too long: ${result.tooLong.map((word) => `\`${word}\``).join(', ')}`);
      if (result.limitReached) problems.push(`The limit of ${MAX_BAD_WORDS} words was reached.`);
      if (problems.length) await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', problems.join('\n')));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:badwords:remove:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_BADWORDS_REMOVE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await deny(interaction)) return;
      const words = await getBadWords(guild.id);
      if (!words.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no words to remove yet.'));
        return;
      }
      await interaction.showModal(buildBadWordsRemoveModal(words));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:badwords:remove:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_BADWORDS_REMOVE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await deny(interaction)) return;
      await interaction.deferUpdate();
      const selected: string[] = [];
      for (const customId of ['words0', 'words1']) {
        try {
          selected.push(...interaction.fields.getStringSelectValues(customId));
        } catch {
          continue;
        }
      }
      if (selected.length) await removeBadWords(guild.id, selected);
      await interaction.editReply(badWordsView(await getBadWords(guild.id)));
    },
  }),
];
