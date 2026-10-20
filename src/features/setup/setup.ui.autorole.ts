import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_AUTO_ROLES } from './setup.model';
import { sep, text, toPayload } from './setup.ui.shared';

export const SETUP_AUTOROLE_BUTTON = 'setup:autorole:view:';
export const SETUP_AUTOROLE_ADD_BUTTON = 'setup:autorole:add';
export const SETUP_AUTOROLE_REMOVE_BUTTON = 'setup:autorole:remove';
export const SETUP_AUTOROLE_ADD_MODAL = 'setup:autorole:modal:add';
export const SETUP_AUTOROLE_REMOVE_MODAL = 'setup:autorole:modal:remove';

export interface AutoRoleEntry {
  id: string;
  name: string;
}

function autoRoleLine(role: AutoRoleEntry): string {
  return `- -# **__Role__** · <@&${role.id}>`;
}

export function autoRoleView(roles: readonly AutoRoleEntry[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Auto Role'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`-# ${roles.length}/${MAX_AUTO_ROLES} roles given automatically when a member joins`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(roles.length ? roles.map(autoRoleLine).join('\n') : '- -# **__Roles__** · None configured yet - use **Add**'),
    );
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_AUTOROLE_ADD_BUTTON).setLabel('Add').setStyle(ButtonStyle.Secondary).setDisabled(roles.length >= MAX_AUTO_ROLES),
      new ButtonBuilder().setCustomId(SETUP_AUTOROLE_REMOVE_BUTTON).setLabel('Remove').setStyle(ButtonStyle.Secondary).setDisabled(roles.length === 0),
    ),
  );
  return toPayload(container);
}

export function buildAutoRoleAddModal(remainingSlots: number): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_AUTOROLE_ADD_MODAL)
    .setTitle('Add Auto Role')
    .addLabelComponents(
      new LabelBuilder().setLabel('Roles').setDescription(`Given automatically when a member joins - up to ${remainingSlots} more`).setRoleSelectMenuComponent((select) =>
        select.setCustomId('roles').setMinValues(1).setMaxValues(Math.max(1, remainingSlots)).setRequired(true),
      ),
    );
}

export function buildAutoRoleRemoveModal(roles: readonly AutoRoleEntry[]): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_AUTOROLE_REMOVE_MODAL)
    .setTitle('Remove Auto Role')
    .addLabelComponents(
      new LabelBuilder().setLabel('Role').setStringSelectMenuComponent((select) => {
        select.setCustomId('role').setMinValues(1).setMaxValues(1);
        for (const role of roles) {
          select.addOptions(new StringSelectMenuOptionBuilder().setLabel(role.name.slice(0, 100)).setValue(role.id));
        }
        return select;
      }),
    );
}
