import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_CHECKER_ROLES } from './setup.model';
import { sep, text, toPayload } from './setup.ui.shared';

export const SETUP_CHECKER_BUTTON = 'setup:checker:view:';
export const SETUP_CHECKER_ROLES_BUTTON = 'setup:checker:roles';
export const SETUP_CHECKER_ROLES_MODAL = 'setup:checker:modal:roles';

function checkerSummary(roleIds: readonly string[]): string {
  const lines = roleIds.length ? roleIds.map((id) => `<@&${id}>`).join(' ') : '`None configured - only Administrators can use checker commands`';
  return `- __**Checker Roles [${roleIds.length}/${MAX_CHECKER_ROLES}]**__ ﹕ ${lines}`;
}

export function checkerView(roleIds: readonly string[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Checkers'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('-# Members with the **Administrator** permission can always use checker commands - they do not need a checker role'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(checkerSummary(roleIds)));

  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_CHECKER_ROLES_BUTTON).setLabel('Checker Roles').setStyle(ButtonStyle.Secondary),
    ),
  );
  return toPayload(container);
}

export function buildCheckerRolesModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_CHECKER_ROLES_MODAL)
    .setTitle('Checker Roles')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Checker Roles')
        .setDescription(`Roles allowed to use checker commands - up to ${MAX_CHECKER_ROLES}, replaces the current list`)
        .setRoleSelectMenuComponent((select) => select.setCustomId('roles').setMinValues(0).setMaxValues(MAX_CHECKER_ROLES).setRequired(false)),
    );
}
