import { type ButtonInteraction, type ModalSubmitInteraction, type StringSelectMenuInteraction } from 'discord.js';
import config, { isOwner } from '../../core/config';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { getGuildPrefix } from '../prefix/prefix.model';
import { PREMIUM_LIST_PAGE_ID, premiumListPayload } from './premium.list';
import { STYLE_TEST_MODAL_PREFIX, buildStyleTestModal, parseColor, styleTestPayload } from './style.test';
import { STYLE_NAV_PREFIX, STYLE_SELECT_ID, STYLE_TEST_BUTTON_PREFIX, parseStyleNavCustomId, styleHelpPayload, styleHelpStartIndex } from './style.ui';

export const routes = [
  defineRoute<ButtonInteraction>({
    name: 'guildprofile-style:test:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(STYLE_TEST_BUTTON_PREFIX),
    async handle(interaction) {
      const ownerId = interaction.customId.slice(STYLE_TEST_BUTTON_PREFIX.length);
      if (interaction.user.id !== ownerId) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${ownerId}> can use these buttons.`));
        return;
      }
      await interaction.showModal(buildStyleTestModal(ownerId));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'guildprofile-style:test:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId.startsWith(STYLE_TEST_MODAL_PREFIX),
    async handle(interaction) {
      const fontId = Number(interaction.fields.getStringSelectValues('font')[0]);
      const effectId = Number(interaction.fields.getStringSelectValues('effect')[0]);
      const first = parseColor(interaction.fields.getTextInputValue('color1'));
      const secondRaw = interaction.fields.getTextInputValue('color2').trim();
      const second = secondRaw ? parseColor(secondRaw) : null;
      if (!first || (secondRaw && !second)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Colors must be six letters or numbers, like `ff00ff`.'));
        return;
      }
      if (effectId === 2 && !second) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'The Gradient effect needs a second color.'));
        return;
      }
      const name = interaction.client.user?.username ?? config.botName;
      await interaction.reply(styleTestPayload(name, { fontId, effectId, colors: second ? [first, second] : [first] }));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'premium:list:page',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && PREMIUM_LIST_PAGE_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = PREMIUM_LIST_PAGE_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, kind, invokerId, pageText] = parsed as unknown as [string, 'user' | 'server', string, string];
      if (interaction.user.id !== invokerId || !isOwner(interaction.user.id)) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${invokerId}> can use these buttons.`));
        return;
      }
      await interaction.update(await premiumListPayload(interaction.client, kind, Number(pageText), invokerId, interaction.guildId));
    },
  }),

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
      const payload = styleHelpPayload(ownerId, botName, prefix, styleHelpStartIndex(value), interaction.guildId);
      delete payload.files;
      await interaction.update(payload);
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
      const payload = styleHelpPayload(parsed.ownerId, botName, prefix, parsed.page, interaction.guildId);
      delete payload.files;
      await interaction.update(payload);
    },
  }),
];
