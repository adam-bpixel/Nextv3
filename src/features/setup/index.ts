import { MessageFlags, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import type { ReplyPayload } from '../../core/context';
import { permissionBit } from '../../core/permissions';
import { getGuildSetup, saveJailSetup, saveVerificationSetup, saveWarnSetup, type JailSetup, type VerificationSetup, type WarnSetup } from './setup.model';
import {
  SETUP_MODAL_PREFIX,
  SETUP_STATUS_BUTTON,
  buildSetupModal,
  fieldsFor,
  jailSavedCard,
  setupOverview,
  verificationSavedCard,
  warnSavedCard,
  type SetupFieldSpec,
  type SetupSection,
} from './setup.ui';

const SECTIONS: readonly SetupSection[] = ['jail', 'verification', 'warn'];
const NO_PERMISSION_TEXT = 'You need the Manage Server permission to configure this.';
const BAD_INPUT_TEXT = 'Pick a value for every field, then submit again.';

function sectionFrom(customId: string): SetupSection | null {
  const key = customId.slice(SETUP_MODAL_PREFIX.length);
  return SECTIONS.find((candidate) => candidate === key) ?? null;
}

function hasManageGuild(interaction: ButtonInteraction | ModalSubmitInteraction): boolean {
  return interaction.memberPermissions?.has(permissionBit('manage_guild')) ?? false;
}

function ephemeral(payload: ReplyPayload): ReplyPayload {
  return { ...payload, flags: (payload.flags ?? 0) | MessageFlags.Ephemeral };
}

function selectedId(interaction: ModalSubmitInteraction, field: SetupFieldSpec): string | null {
  if (field.kind === 'role') return interaction.fields.getSelectedRoles(field.id, true).first()?.id ?? null;
  return interaction.fields.getSelectedChannels(field.id, true).first()?.id ?? null;
}

export const routes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:status',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_STATUS_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply({ content: NO_PERMISSION_TEXT, flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply(ephemeral(setupOverview(await getGuildSetup(guild.id))));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_MODAL_PREFIX),
    async handle(interaction) {
      const section = sectionFrom(interaction.customId);
      if (!section) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply({ content: NO_PERMISSION_TEXT, flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.showModal(buildSetupModal(section));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId.startsWith(SETUP_MODAL_PREFIX),
    async handle(interaction) {
      const section = sectionFrom(interaction.customId);
      const guild = interaction.guild;
      if (!section || !guild) return;
      if (!hasManageGuild(interaction)) {
        await interaction.reply({ content: NO_PERMISSION_TEXT, flags: MessageFlags.Ephemeral });
        return;
      }

      const ids = fieldsFor(section).map((field) => selectedId(interaction, field));
      if (ids.some((id) => !id)) {
        await interaction.reply({ content: BAD_INPUT_TEXT, flags: MessageFlags.Ephemeral });
        return;
      }

      if (section === 'jail') {
        const [jailerRoleId, jailedRoleId, logsChannelId] = ids as [string, string, string];
        const data: JailSetup = { jailerRoleId, jailedRoleId, logsChannelId };
        await saveJailSetup(guild.id, data);
        await interaction.reply(ephemeral(jailSavedCard(data)));
        return;
      }

      if (section === 'verification') {
        const [verifiedRoleId, verifiedFemaleRoleId, unverifiedRoleId, verificatorRoleId, logsChannelId] = ids as [string, string, string, string, string];
        const data: VerificationSetup = { verifiedRoleId, verifiedFemaleRoleId, unverifiedRoleId, verificatorRoleId, logsChannelId };
        await saveVerificationSetup(guild.id, data);
        await interaction.reply(ephemeral(verificationSavedCard(data)));
        return;
      }

      const [firstWarnRoleId, secondWarnRoleId, lastWarnRoleId, warnerRoleId, logsChannelId] = ids as [string, string, string, string, string];
      const data: WarnSetup = { firstWarnRoleId, secondWarnRoleId, lastWarnRoleId, warnerRoleId, logsChannelId };
      await saveWarnSetup(guild.id, data);
      await interaction.reply(ephemeral(warnSavedCard(data)));
    },
  }),
];
