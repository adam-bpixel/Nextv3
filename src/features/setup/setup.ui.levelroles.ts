import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder, TextInputStyle } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_LEVEL_ROLES, MAX_LEVEL_ROLE_LEVEL, MIN_LEVEL_ROLE_LEVEL, type LevelKind } from './setup.model';
import { sep, text, toPayload } from './setup.ui.shared';

export const SETUP_LEVELROLES_BUTTON = 'setup:levelroles:view:';
export const SETUP_LEVELROLES_ADD_BUTTON = 'setup:levelroles:add';
export const SETUP_LEVELROLES_REMOVE_BUTTON = 'setup:levelroles:remove';
export const SETUP_LEVELROLES_ADD_MODAL = 'setup:levelroles:modal:add';
export const SETUP_LEVELROLES_REMOVE_MODAL = 'setup:levelroles:modal:remove';

export interface LevelRoleView {
  id: string;
  roleId: string;
  roleName: string;
  level: number;
  kind: LevelKind;
}

const kindLabel = (kind: LevelKind): string => (kind === 'chat' ? 'Chat' : 'Voice');

function levelRoleLine(entry: LevelRoleView): string {
  return `- -# **__Level ${entry.level} · ${kindLabel(entry.kind)}__** · <@&${entry.roleId}>`;
}

export function levelRolesView(entries: readonly LevelRoleView[]): ReplyPayload {
  const sorted = [...entries].sort((a, b) => a.level - b.level || a.kind.localeCompare(b.kind));
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Level Roles'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`-# ${entries.length}/${MAX_LEVEL_ROLES} roles given automatically when a member reaches a level`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(sorted.length ? sorted.map(levelRoleLine).join('\n') : '- -# **__Roles__** · None configured yet - use **Add**'),
    );
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_LEVELROLES_ADD_BUTTON).setLabel('Add').setStyle(ButtonStyle.Secondary).setDisabled(entries.length >= MAX_LEVEL_ROLES),
      new ButtonBuilder().setCustomId(SETUP_LEVELROLES_REMOVE_BUTTON).setLabel('Remove').setStyle(ButtonStyle.Secondary).setDisabled(entries.length === 0),
    ),
  );
  return toPayload(container);
}

export function buildLevelRoleAddModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_LEVELROLES_ADD_MODAL)
    .setTitle('Add Level Role')
    .addLabelComponents(
      new LabelBuilder().setLabel('Role').setDescription('The role given at this level').setRoleSelectMenuComponent((select) =>
        select.setCustomId('role').setMinValues(1).setMaxValues(1).setRequired(true),
      ),
      new LabelBuilder().setLabel('Level').setDescription(`The level required to receive this role (${MIN_LEVEL_ROLE_LEVEL}-${MAX_LEVEL_ROLE_LEVEL})`).setTextInputComponent((input) =>
        input.setCustomId('level').setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(4).setRequired(true).setPlaceholder('e.g. 10'),
      ),
      new LabelBuilder().setLabel('Type').setDescription('Whether this tracks chat levels or voice levels').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('kind')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Chat').setValue('chat').setDescription('Based on the chat level').setDefault(true),
            new StringSelectMenuOptionBuilder().setLabel('Voice').setValue('voice').setDescription('Based on the voice level'),
          ),
      ),
    );
}

export function buildLevelRoleRemoveModal(entries: readonly LevelRoleView[]): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_LEVELROLES_REMOVE_MODAL)
    .setTitle('Remove Level Role')
    .addLabelComponents(
      new LabelBuilder().setLabel('Level Role').setStringSelectMenuComponent((select) => {
        select.setCustomId('entry').setMinValues(1).setMaxValues(1);
        for (const entry of entries) {
          select.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(`Level ${entry.level} · ${kindLabel(entry.kind)}`.slice(0, 100))
              .setValue(entry.id)
              .setDescription(entry.roleName.slice(0, 100)),
          );
        }
        return select;
      }),
    );
}
