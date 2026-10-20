import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_SETUP_ROLE_LIST, type WarnSetup } from './setup.model';
import { LOG_CHANNEL_TYPES, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_WARN_BUTTON = 'setup:warn:view:';
export const SETUP_WARN_FIRST_BUTTON = 'setup:warn:first';
export const SETUP_WARN_SECOND_BUTTON = 'setup:warn:second';
export const SETUP_WARN_LAST_BUTTON = 'setup:warn:last';
export const SETUP_WARN_WARNER_BUTTON = 'setup:warn:warner';
export const SETUP_WARN_LOGS_BUTTON = 'setup:warn:logs';
export const SETUP_WARN_SAVE_BUTTON = 'setup:warn:save';
export const SETUP_WARN_FIRST_MODAL = 'setup:warn:modal:first';
export const SETUP_WARN_SECOND_MODAL = 'setup:warn:modal:second';
export const SETUP_WARN_LAST_MODAL = 'setup:warn:modal:last';
export const SETUP_WARN_WARNER_MODAL = 'setup:warn:modal:warner';
export const SETUP_WARN_LOGS_MODAL = 'setup:warn:modal:logs';

function warnSummary(setup: WarnSetup): string {
  const warnerLines = setup.warnerRoleIds.length ? setup.warnerRoleIds.map((id) => `<@&${id}>`).join(' ') : '`None configured`';
  return [
    `- __**First Warn Role**__ ﹕ ${setup.firstWarnRoleId ? `<@&${setup.firstWarnRoleId}>` : '`Not set`'}`,
    `- __**Second Warn Role**__ ﹕ ${setup.secondWarnRoleId ? `<@&${setup.secondWarnRoleId}>` : '`Not set`'}`,
    `- __**Last Warn Role**__ ﹕ ${setup.lastWarnRoleId ? `<@&${setup.lastWarnRoleId}>` : '`Not set`'}`,
    `- __**Warner Roles [${setup.warnerRoleIds.length}/${MAX_SETUP_ROLE_LIST}]**__ ﹕ ${warnerLines}`,
    `- __**Logs Channel**__ ﹕ ${setup.logsChannelId ? `<#${setup.logsChannelId}>` : '`Not set`'}`,
  ].join('\n');
}

export function warnView(setup: WarnSetup): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Warn System'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('-# Members with the **Administrator** permission can always use warn commands - they do not need a warner role'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(warnSummary(setup)));

  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_WARN_FIRST_BUTTON).setLabel('First Warn Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_WARN_SECOND_BUTTON).setLabel('Second Warn Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_WARN_LAST_BUTTON).setLabel('Last Warn Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_WARN_WARNER_BUTTON).setLabel('Warner Roles').setStyle(ButtonStyle.Secondary),
    ),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_WARN_LOGS_BUTTON).setLabel('Logs Channel').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_WARN_SAVE_BUTTON).setLabel('Save').setStyle(ButtonStyle.Success),
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

export function buildFirstWarnRoleModal(): ModalBuilder {
  return singleRoleModal(SETUP_WARN_FIRST_MODAL, 'First Warn Role', 'First Warn Role', 'Assigned after the first warning');
}

export function buildSecondWarnRoleModal(): ModalBuilder {
  return singleRoleModal(SETUP_WARN_SECOND_MODAL, 'Second Warn Role', 'Second Warn Role', 'Assigned after the second warning');
}

export function buildLastWarnRoleModal(): ModalBuilder {
  return singleRoleModal(SETUP_WARN_LAST_MODAL, 'Last Warn Role', 'Last Warn Role', 'Assigned after the final warning');
}

export function buildWarnerRolesModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_WARN_WARNER_MODAL)
    .setTitle('Warner Roles')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Warner Roles')
        .setDescription(`Roles allowed to warn members - up to ${MAX_SETUP_ROLE_LIST}, replaces the current list`)
        .setRoleSelectMenuComponent((select) => select.setCustomId('roles').setMinValues(0).setMaxValues(MAX_SETUP_ROLE_LIST).setRequired(false)),
    );
}

export function buildWarnLogsModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_WARN_LOGS_MODAL)
    .setTitle('Warn Logs Channel')
    .addLabelComponents(
      new LabelBuilder().setLabel('Logs Channel').setDescription('Where warn actions are logged').setChannelSelectMenuComponent((select) =>
        select.setCustomId('channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true),
      ),
    );
}
