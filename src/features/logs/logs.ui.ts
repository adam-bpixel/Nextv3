import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ContainerBuilder,
  LabelBuilder,
  ModalBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  MessageFlags,
} from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { LOG_CATEGORIES, type GuildLogsConfig, type LogCategoryDef } from './logs.model';

export const SETUP_LOGS_BUTTON = 'setup:logs:view:';
export const SETUP_LOGS_CATEGORY_SELECT = 'setup:logs:category:select';
export const SETUP_LOGS_CHANNEL_PREFIX = 'setup:logs:channel:';
export const SETUP_LOGS_TOGGLE_PREFIX = 'setup:logs:toggle:';
export const SETUP_LOGS_BACK_BUTTON = 'setup:logs:back';
export const SETUP_LOGS_MODAL_PREFIX = 'setup:logs:modal:';

const LOG_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement] as const;

const text = (content: string): TextDisplayBuilder => new TextDisplayBuilder().setContent(content);
const sep = (): SeparatorBuilder => new SeparatorBuilder();

function toPayload(container: ContainerBuilder, ephemeral = false): ReplyPayload {
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0) };
}

function configuredCount(category: LogCategoryDef, config_: GuildLogsConfig): number {
  return category.events.filter((event) => config_.events[event.key]?.enabled).length;
}

export function logsOverviewView(config_: GuildLogsConfig): ReplyPayload {
  const select = new StringSelectMenuBuilder()
    .setCustomId(SETUP_LOGS_CATEGORY_SELECT)
    .setPlaceholder('Pick a category to configure')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      LOG_CATEGORIES.map((category) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(category.label)
          .setValue(category.key)
          .setDescription(`${configuredCount(category, config_)}/${category.events.length} events configured`),
      ),
    );

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('# Server Logs'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('-# Pick a category, then set a channel and the events you want logged there.'))
    .addSeparatorComponents(sep())
    .addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select));
  return toPayload(container, true);
}

function eventLine(event: LogCategoryDef['events'][number], config_: GuildLogsConfig): string {
  const setting = config_.events[event.key];
  const status = setting ? `<#${setting.channelId}> · ${setting.enabled ? 'Enabled' : 'Disabled'}` : 'Not configured';
  return `- -# **__${event.label}__** · ${status}`;
}

export function logsCategoryView(category: LogCategoryDef, config_: GuildLogsConfig): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${category.label}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(category.events.map((event) => eventLine(event, config_)).join('\n')));

  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`${SETUP_LOGS_CHANNEL_PREFIX}${category.key}`).setLabel('Set Channel').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_LOGS_BACK_BUTTON).setLabel('Back').setStyle(ButtonStyle.Secondary),
    ),
  );

  const configured = category.events.filter((event) => config_.events[event.key]);
  if (configured.length) {
    const toggleSelect = new StringSelectMenuBuilder()
      .setCustomId(`${SETUP_LOGS_TOGGLE_PREFIX}${category.key}`)
      .setPlaceholder('Enable or disable an event')
      .setMinValues(1)
      .setMaxValues(1);
    for (const event of configured) {
      const setting = config_.events[event.key];
      toggleSelect.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(event.label)
          .setValue(event.key)
          .setDescription(setting?.enabled ? 'Enabled — select to disable' : 'Disabled — select to enable'),
      );
    }
    container.addSeparatorComponents(sep()).addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(toggleSelect));
  }

  return toPayload(container, true);
}

export function buildLogsChannelModal(category: LogCategoryDef): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${SETUP_LOGS_MODAL_PREFIX}${category.key}`)
    .setTitle(`${category.label} — Set Channel`.slice(0, 45))
    .addLabelComponents(
      new LabelBuilder().setLabel('Events').setDescription('Which events in this category to log').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('events')
          .setMinValues(1)
          .setMaxValues(category.events.length)
          .addOptions(category.events.map((event) => new StringSelectMenuOptionBuilder().setLabel(event.label).setValue(event.key))),
      ),
      new LabelBuilder().setLabel('Channel').setDescription('Where these events will be posted').setChannelSelectMenuComponent((select) =>
        select.setCustomId('channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true),
      ),
    );
}
