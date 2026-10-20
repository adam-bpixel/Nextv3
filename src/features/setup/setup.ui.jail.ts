import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_SETUP_ROLE_LIST, type JailSetup } from './setup.model';
import { LOG_CHANNEL_TYPES, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_JAIL_BUTTON = 'setup:jail:view:';
export const SETUP_JAIL_JAILER_BUTTON = 'setup:jail:jailer';
export const SETUP_JAIL_JAILED_BUTTON = 'setup:jail:jailed';
export const SETUP_JAIL_LOGS_BUTTON = 'setup:jail:logs';
export const SETUP_JAIL_SAVE_BUTTON = 'setup:jail:save';
export const SETUP_JAIL_JAILER_MODAL = 'setup:jail:modal:jailer';
export const SETUP_JAIL_JAILED_MODAL = 'setup:jail:modal:jailed';
export const SETUP_JAIL_LOGS_MODAL = 'setup:jail:modal:logs';

function jailSummary(setup: JailSetup): string {
  const jailerLines = setup.jailerRoleIds.length ? setup.jailerRoleIds.map((id) => `<@&${id}>`).join(' ') : '`None configured`';
  return [
    `- __**Jailer Roles [${setup.jailerRoleIds.length}/${MAX_SETUP_ROLE_LIST}]**__ ﹕ ${jailerLines}`,
    `- __**Jailed Role**__ ﹕ ${setup.jailedRoleId ? `<@&${setup.jailedRoleId}>` : '`Not set`'}`,
    `- __**Logs Channel**__ ﹕ ${setup.logsChannelId ? `<#${setup.logsChannelId}>` : '`Not set`'}`,
  ].join('\n');
}

export function jailView(setup: JailSetup): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Jail System'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('-# Members with the **Administrator** permission can always use jail commands - they do not need a jailer role'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(jailSummary(setup)));

  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_JAIL_JAILER_BUTTON).setLabel('Jailer Roles').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_JAIL_JAILED_BUTTON).setLabel('Jailed Role').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_JAIL_LOGS_BUTTON).setLabel('Logs Channel').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_JAIL_SAVE_BUTTON).setLabel('Save').setStyle(ButtonStyle.Success),
    ),
  );
  return toPayload(container);
}

export function buildJailerRolesModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_JAIL_JAILER_MODAL)
    .setTitle('Jailer Roles')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Jailer Roles')
        .setDescription(`Roles allowed to use jail commands - up to ${MAX_SETUP_ROLE_LIST}, replaces the current list`)
        .setRoleSelectMenuComponent((select) => select.setCustomId('roles').setMinValues(0).setMaxValues(MAX_SETUP_ROLE_LIST).setRequired(false)),
    );
}

export function buildJailedRoleModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_JAIL_JAILED_MODAL)
    .setTitle('Jailed Role')
    .addLabelComponents(
      new LabelBuilder().setLabel('Jailed Role').setDescription('Assigned to a member when jailed').setRoleSelectMenuComponent((select) =>
        select.setCustomId('role').setMinValues(1).setMaxValues(1).setRequired(true),
      ),
    );
}

export function buildJailLogsModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_JAIL_LOGS_MODAL)
    .setTitle('Jail Logs Channel')
    .addLabelComponents(
      new LabelBuilder().setLabel('Logs Channel').setDescription('Where jail actions are logged').setChannelSelectMenuComponent((select) =>
        select.setCustomId('channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true),
      ),
    );
}
