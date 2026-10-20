import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_SETUP_ROLE_LIST, type VerificationSetup } from './setup.model';
import { LOG_CHANNEL_TYPES, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_VERIFICATION_BUTTON = 'setup:verification:view:';
export const SETUP_VERIFICATION_VERIFIED_BUTTON = 'setup:verification:verified';
export const SETUP_VERIFICATION_FEMALE_BUTTON = 'setup:verification:female';
export const SETUP_VERIFICATION_UNVERIFIED_BUTTON = 'setup:verification:unverified';
export const SETUP_VERIFICATION_VERIFICATOR_BUTTON = 'setup:verification:verificator';
export const SETUP_VERIFICATION_LOGS_BUTTON = 'setup:verification:logs';
export const SETUP_VERIFICATION_SAVE_BUTTON = 'setup:verification:save';
export const SETUP_VERIFICATION_VERIFIED_MODAL = 'setup:verification:modal:verified';
export const SETUP_VERIFICATION_FEMALE_MODAL = 'setup:verification:modal:female';
export const SETUP_VERIFICATION_UNVERIFIED_MODAL = 'setup:verification:modal:unverified';
export const SETUP_VERIFICATION_VERIFICATOR_MODAL = 'setup:verification:modal:verificator';
export const SETUP_VERIFICATION_LOGS_MODAL = 'setup:verification:modal:logs';

function verificationSummary(setup: VerificationSetup): string {
  const verificatorLines = setup.verificatorRoleIds.length
    ? setup.verificatorRoleIds.map((id) => `<@&${id}>`).join(' ')
    : '`None configured`';
  return [
    `- __**Verified Role**__ ﹕ ${setup.verifiedRoleId ? `<@&${setup.verifiedRoleId}>` : '`Not set`'}`,
    `- __**Verified Female Role**__ ﹕ ${setup.verifiedFemaleRoleId ? `<@&${setup.verifiedFemaleRoleId}>` : '`Not set`'}`,
    `- __**Unverified Role**__ ﹕ ${setup.unverifiedRoleId ? `<@&${setup.unverifiedRoleId}>` : '`Not set`'}`,
    `- __**Verificator Roles [${setup.verificatorRoleIds.length}/${MAX_SETUP_ROLE_LIST}]**__ ﹕ ${verificatorLines}`,
    `- __**Logs Channel**__ ﹕ ${setup.logsChannelId ? `<#${setup.logsChannelId}>` : '`Not set`'}`,
  ].join('\n');
}

export function verificationView(setup: VerificationSetup): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Verification System'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('-# Members with the **Administrator** permission can always verify members - they do not need a verificator role'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(verificationSummary(setup)));

  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_VERIFICATION_VERIFIED_BUTTON).setLabel('Verified Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_VERIFICATION_FEMALE_BUTTON).setLabel('Female Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_VERIFICATION_UNVERIFIED_BUTTON).setLabel('Unverified Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_VERIFICATION_VERIFICATOR_BUTTON).setLabel('Verificator Roles').setStyle(ButtonStyle.Secondary),
    ),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_VERIFICATION_LOGS_BUTTON).setLabel('Logs Channel').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_VERIFICATION_SAVE_BUTTON).setLabel('Save').setStyle(ButtonStyle.Success),
    ),
  );
  return toPayload(container);
}

function singleRoleModal(customId: string, title: string, label: string, description: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addLabelComponents(
      new LabelBuilder().setLabel(label).setDescription(description).setRoleSelectMenuComponent((select) =>
        select.setCustomId('role').setMinValues(1).setMaxValues(1).setRequired(true),
      ),
    );
}

export function buildVerifiedRoleModal(): ModalBuilder {
  return singleRoleModal(SETUP_VERIFICATION_VERIFIED_MODAL, 'Verified Role', 'Verified Role', 'Given to members verified as male');
}

export function buildVerifiedFemaleRoleModal(): ModalBuilder {
  return singleRoleModal(SETUP_VERIFICATION_FEMALE_MODAL, 'Verified Female Role', 'Verified Female Role', 'Given to members verified as female');
}

export function buildUnverifiedRoleModal(): ModalBuilder {
  return singleRoleModal(SETUP_VERIFICATION_UNVERIFIED_MODAL, 'Unverified Role', 'Unverified Role', 'Removed once a member is verified');
}

export function buildVerificatorRolesModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_VERIFICATION_VERIFICATOR_MODAL)
    .setTitle('Verificator Roles')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Verificator Roles')
        .setDescription(`Roles allowed to verify members - up to ${MAX_SETUP_ROLE_LIST}, replaces the current list`)
        .setRoleSelectMenuComponent((select) => select.setCustomId('roles').setMinValues(0).setMaxValues(MAX_SETUP_ROLE_LIST).setRequired(false)),
    );
}

export function buildVerificationLogsModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_VERIFICATION_LOGS_MODAL)
    .setTitle('Verification Logs Channel')
    .addLabelComponents(
      new LabelBuilder().setLabel('Logs Channel').setDescription('Where verification actions are logged').setChannelSelectMenuComponent((select) =>
        select.setCustomId('channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true),
      ),
    );
}
