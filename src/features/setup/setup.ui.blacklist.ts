import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { MAX_BLACKLISTED_CHANNELS } from './setup.model';
import { LOG_CHANNEL_TYPES, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_BLACKLIST_BUTTON = 'setup:blacklist:view:';
export const SETUP_BLACKLIST_ADD_BUTTON = 'setup:blacklist:add';
export const SETUP_BLACKLIST_REMOVE_BUTTON = 'setup:blacklist:remove';
export const SETUP_BLACKLIST_ADD_MODAL = 'setup:blacklist:modal:add';
export const SETUP_BLACKLIST_REMOVE_MODAL = 'setup:blacklist:modal:remove';

export interface BlacklistChannelEntry {
  id: string;
  name: string;
}

function blacklistLine(channel: BlacklistChannelEntry): string {
  return `- -# **__Channel__** · <#${channel.id}>`;
}

export function blacklistView(channels: readonly BlacklistChannelEntry[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Blacklisted Channels'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`-# ${channels.length}/${MAX_BLACKLISTED_CHANNELS} channels where bot commands are disabled`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(channels.length ? channels.map(blacklistLine).join('\n') : '- -# **__Channels__** · None configured yet - use **Add**'),
    );
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_BLACKLIST_ADD_BUTTON).setLabel('Add').setStyle(ButtonStyle.Secondary).setDisabled(channels.length >= MAX_BLACKLISTED_CHANNELS),
      new ButtonBuilder().setCustomId(SETUP_BLACKLIST_REMOVE_BUTTON).setLabel('Remove').setStyle(ButtonStyle.Secondary).setDisabled(channels.length === 0),
    ),
  );
  return toPayload(container);
}

export function buildBlacklistAddModal(remainingSlots: number): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_BLACKLIST_ADD_MODAL)
    .setTitle('Blacklist Channels')
    .addLabelComponents(
      new LabelBuilder().setLabel('Channels').setDescription(`Bot commands will be disabled here - up to ${remainingSlots} more`).setChannelSelectMenuComponent((select) =>
        select.setCustomId('channels').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(Math.max(1, remainingSlots)).setRequired(true),
      ),
    );
}

export function buildBlacklistRemoveModal(channels: readonly BlacklistChannelEntry[]): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_BLACKLIST_REMOVE_MODAL)
    .setTitle('Unblock Channel')
    .addLabelComponents(
      new LabelBuilder().setLabel('Channel').setStringSelectMenuComponent((select) => {
        select.setCustomId('channel').setMinValues(1).setMaxValues(1);
        for (const channel of channels) {
          select.addOptions(new StringSelectMenuOptionBuilder().setLabel(channel.name.slice(0, 100)).setValue(channel.id));
        }
        return select;
      }),
    );
}
