import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import type { TagRoleConfig } from '../tagrole/tagrole.model';
import { sep, text, toPayload } from './setup.ui.shared';

export const SETUP_TAGROLE_BUTTON = 'setup:tagrole:view:';
export const SETUP_TAGROLE_ROLE_BUTTON = 'setup:tagrole:role';
export const SETUP_TAGROLE_STATUS_BUTTON = 'setup:tagrole:status';
export const SETUP_TAGROLE_MODAL = 'setup:tagrole:modal:role';
export const SETUP_TAGROLE_STATUS_MODAL = 'setup:tagrole:modal:status';

export function tagRoleView(current: TagRoleConfig): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Tag Role'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('-# Members who wear this server tag receive the role automatically'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(
        [
          `- -# **__Role__** · ${current.roleId ? `<@&${current.roleId}>` : 'None configured yet - use **Role**'}`,
          `- -# **__Status__** · \`${current.enabled ? 'Enabled' : 'Disabled'}\``,
        ].join('\n'),
      ),
    )
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(SETUP_TAGROLE_ROLE_BUTTON).setLabel('Role').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(SETUP_TAGROLE_STATUS_BUTTON).setLabel('Status').setStyle(ButtonStyle.Secondary).setDisabled(!current.roleId),
      ),
    );
  return toPayload(container);
}

export function buildTagRoleModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_TAGROLE_MODAL)
    .setTitle('Tag Role')
    .addLabelComponents(
      new LabelBuilder().setLabel('Role').setDescription('Given to members who wear this server tag').setRoleSelectMenuComponent((select) =>
        select.setCustomId('role').setMinValues(1).setMaxValues(1).setRequired(true),
      ),
    );
}

export function buildTagRoleStatusModal(enabled: boolean): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_TAGROLE_STATUS_MODAL)
    .setTitle('Tag Role Status')
    .addLabelComponents(
      new LabelBuilder().setLabel('Status').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('status')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Enabled').setValue('enabled').setDefault(enabled),
            new StringSelectMenuOptionBuilder().setLabel('Disabled').setValue('disabled').setDefault(!enabled),
          ),
      ),
    );
}
