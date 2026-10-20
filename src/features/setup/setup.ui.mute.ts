import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_SETUP_ROLE_LIST, type MuteSetup } from './setup.model';
import { LOG_CHANNEL_TYPES, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_MUTE_BUTTON = 'setup:mute:view:';
export const SETUP_MUTE_MUTER_BUTTON = 'setup:mute:muter';
export const SETUP_MUTE_MUTED_BUTTON = 'setup:mute:muted';
export const SETUP_MUTE_LOGS_BUTTON = 'setup:mute:logs';
export const SETUP_MUTE_SAVE_BUTTON = 'setup:mute:save';
export const SETUP_MUTE_MUTER_MODAL = 'setup:mute:modal:muter';
export const SETUP_MUTE_MUTED_MODAL = 'setup:mute:modal:muted';
export const SETUP_MUTE_LOGS_MODAL = 'setup:mute:modal:logs';

function muteSummary(setup: MuteSetup): string {
  const muterLines = setup.muterRoleIds.length ? setup.muterRoleIds.map((id) => `<@&${id}>`).join(' ') : '`None configured`';
  return [
    `- __**Muter Roles [${setup.muterRoleIds.length}/${MAX_SETUP_ROLE_LIST}]**__ ﹕ ${muterLines}`,
    `- __**Muted Role**__ ﹕ ${setup.mutedRoleId ? `<@&${setup.mutedRoleId}>` : '`Not set`'}`,
    `- __**Logs Channel**__ ﹕ ${setup.logsChannelId ? `<#${setup.logsChannelId}>` : '`Not set`'}`,
  ].join('\n');
}

export function muteView(setup: MuteSetup): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Mute System'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('-# Members with the **Administrator** permission can always use mute commands - they do not need a muter role'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(muteSummary(setup)));

  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_MUTE_MUTER_BUTTON).setLabel('Muter Roles').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_MUTE_MUTED_BUTTON).setLabel('Muted Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_MUTE_LOGS_BUTTON).setLabel('Logs Channel').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_MUTE_SAVE_BUTTON).setLabel('Save').setStyle(ButtonStyle.Success),
    ),
  );
  return toPayload(container);
}

export function buildMuterRolesModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_MUTE_MUTER_MODAL)
    .setTitle('Muter Roles')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Muter Roles')
        .setDescription(`Roles allowed to use mute commands - up to ${MAX_SETUP_ROLE_LIST}, replaces the current list`)
        .setRoleSelectMenuComponent((select) => select.setCustomId('roles').setMinValues(0).setMaxValues(MAX_SETUP_ROLE_LIST).setRequired(false)),
    );
}

export function buildMutedRoleModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_MUTE_MUTED_MODAL)
    .setTitle('Muted Role')
    .addLabelComponents(
      new LabelBuilder().setLabel('Muted Role').setDescription('Assigned to a member when muted').setRoleSelectMenuComponent((select) =>
        select.setCustomId('role').setMinValues(1).setMaxValues(1).setRequired(true),
      ),
    );
}

export function buildMuteLogsModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_MUTE_LOGS_MODAL)
    .setTitle('Mute Logs Channel')
    .addLabelComponents(
      new LabelBuilder().setLabel('Logs Channel').setDescription('Where mute and vmute actions are logged').setChannelSelectMenuComponent((select) =>
        select.setCustomId('channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true),
      ),
    );
}
