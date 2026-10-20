import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction, type StringSelectMenuInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import {
  addPendingApply,
  findPendingApply,
  findPendingApplyByMessage,
  getGuildSetup,
  removePendingApplyByUser,
  type ApplyCategory,
} from './setup.model';
import { hasManageGuild } from './setup.routes.helpers';
import { getServerInviteURL } from './setup.ui.shared';
import {
  APPLY_ACCEPT_BUTTON,
  APPLY_FORM_PREFIX,
  APPLY_OPEN_PREFIX,
  APPLY_OPEN_SELECT_ID,
  APPLY_REJECT_BUTTON,
  applyDecisionDM,
  applyReviewCard,
  buildApplicationFormModal,
} from './setup.ui.apply';

async function applyForCategory(interaction: ButtonInteraction | StringSelectMenuInteraction, categoryId: string): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;

  const setup = await getGuildSetup(guild.id);
  const category = (setup.applyCategories ?? []).find((candidate) => candidate.id === categoryId);
  if (!category || !setup.apply) {
    await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'Applications are not set up yet.'));
    return;
  }
  if (!category.questions.length) {
    await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'This category has no questions configured yet.'));
    return;
  }
  if (findPendingApply(setup, interaction.user.id)) {
    await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'You already have a pending application. Use `/cancelapply` to withdraw it first.'));
    return;
  }
  await interaction.showModal(buildApplicationFormModal(category));
}

async function decideApplication(interaction: ButtonInteraction, verdict: 'Accepted' | 'Rejected'): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;
  await interaction.deferUpdate();

  const setup = await getGuildSetup(guild.id);
  const managerRoleIds = setup.apply?.managerRoleIds ?? [];
  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  const canReview = hasManageGuild(interaction) || (member ? managerRoleIds.some((roleId) => member.roles.cache.has(roleId)) : false);
  if (!canReview) {
    await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', "You don't have permission to review applications."));
    return;
  }

  const pending = findPendingApplyByMessage(setup, interaction.message.id);
  if (!pending) {
    await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', 'This application could not be found - it may have already been decided.'));
    return;
  }

  const category: ApplyCategory = (setup.applyCategories ?? []).find((candidate) => candidate.id === pending.categoryId) ?? {
    id: pending.categoryId,
    name: 'Unknown',
    questions: [],
  };
  await interaction.editReply(applyReviewCard(pending.userId, category, pending.answers, { verdict, reviewerId: interaction.user.id }));
  await removePendingApplyByUser(guild.id, pending.userId);

  const applicant = await interaction.client.users.fetch(pending.userId).catch(() => null);
  if (applicant) {
    const inviteURL = await getServerInviteURL(guild);
    await applicant.send(applyDecisionDM(guild.name, category.name, verdict, inviteURL)).catch(() => null);
  }
}

export const applyApplicantRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:apply:open:button',
    match: (interaction): interaction is ButtonInteraction =>
      interaction.isButton() && interaction.customId.startsWith(APPLY_OPEN_PREFIX) && interaction.customId !== APPLY_OPEN_SELECT_ID,
    async handle(interaction) {
      await applyForCategory(interaction, interaction.customId.slice(APPLY_OPEN_PREFIX.length));
    },
  }),

  defineRoute<StringSelectMenuInteraction>({
    name: 'setup:apply:open:select',
    match: (interaction): interaction is StringSelectMenuInteraction => interaction.isStringSelectMenu() && interaction.customId === APPLY_OPEN_SELECT_ID,
    async handle(interaction) {
      const categoryId = interaction.values[0];
      if (!categoryId) return;
      await applyForCategory(interaction, categoryId);
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:apply:form:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId.startsWith(APPLY_FORM_PREFIX),
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      const categoryId = interaction.customId.slice(APPLY_FORM_PREFIX.length);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const setup = await getGuildSetup(guild.id);
      const category = (setup.applyCategories ?? []).find((candidate) => candidate.id === categoryId);
      const applySettings = setup.apply;
      if (!category || !applySettings) {
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'Applications are not set up yet.'));
        return;
      }
      if (findPendingApply(setup, interaction.user.id)) {
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'You already have a pending application.'));
        return;
      }

      const answers = category.questions.map((_, index) => interaction.fields.getTextInputValue(`q${index}`).trim());

      const reviewChannel = await guild.channels.fetch(applySettings.logChannelId).catch(() => null);
      if (!reviewChannel?.isTextBased()) {
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'The review channel is no longer available - contact an admin.'));
        return;
      }

      let sent;
      try {
        sent = await reviewChannel.send(applyReviewCard(interaction.user.id, category, answers));
      } catch (error) {
        console.error('Posting application review card failed:', error);
        await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', "I couldn't submit your application - please let an admin know."));
        return;
      }

      await addPendingApply(guild.id, { userId: interaction.user.id, categoryId, messageId: sent.id, channelId: reviewChannel.id, answers });
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', 'Your application has been submitted.'));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:decision:accept',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === APPLY_ACCEPT_BUTTON,
    async handle(interaction) {
      await decideApplication(interaction, 'Accepted');
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:apply:decision:reject',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === APPLY_REJECT_BUTTON,
    async handle(interaction) {
      await decideApplication(interaction, 'Rejected');
    },
  }),
];
