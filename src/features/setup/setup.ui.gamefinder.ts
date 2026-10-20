import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  LabelBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputStyle,
} from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { GAMEFINDER_ICON } from '../../core/emojis';
import { formatDuration } from '../../core/format';
import {
  GAMEFINDER_TAG_PREFIX,
  GAMEFINDER_TAG_SELECT_ID,
  MAX_GAMES,
  type GameFinderGame,
  type GameFinderPanelStyle,
  type GameFinderSettings,
} from '../gamefinder/gamefinder.model';
import { LOG_CHANNEL_TYPES, chunk, parsedEmoji, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_GAMEFINDER_BUTTON = 'setup:gamefinder:view:';
export const SETUP_GAMEFINDER_ADD_BUTTON = 'setup:gamefinder:add';
export const SETUP_GAMEFINDER_REMOVE_BUTTON = 'setup:gamefinder:remove';
export const SETUP_GAMEFINDER_SETTINGS_BUTTON = 'setup:gamefinder:settings';
export const SETUP_GAMEFINDER_SEND_BUTTON = 'setup:gamefinder:send';
export const SETUP_GAMEFINDER_ADD_MODAL = 'setup:gamefinder:modal:add';
export const SETUP_GAMEFINDER_REMOVE_MODAL = 'setup:gamefinder:modal:remove';
export const SETUP_GAMEFINDER_SETTINGS_MODAL = 'setup:gamefinder:modal:settings';

function gameLine(game: GameFinderGame, index: number): string {
  const emoji = game.emoji ? `${game.emoji} ` : '';
  return `**${index + 1}.** ${emoji}<@&${game.roleId}> — \`${game.name}\``;
}

function panelStyleLabel(style: GameFinderPanelStyle): string {
  return style === 'select' ? 'Select Menu' : 'Buttons';
}

export function gameFinderView(settings: GameFinderSettings): ReplyPayload {
  const lines = settings.games.length ? settings.games.map(gameLine).join('\n') : '- No games yet. Use **Add** to create one.';
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Game Finder'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(
        `- __Cooldown:__ \`${formatDuration(settings.cooldownMs)}\` (managers get 50% of this)\n` +
          `- __Panel channel:__ ${settings.panelChannelId ? `<#${settings.panelChannelId}>` : '*Not set*'}\n` +
          `- __Manager role:__ ${settings.managerRoleId ? `<@&${settings.managerRoleId}>` : '*Not set*'}\n` +
          `- __Panel style:__ \`${panelStyleLabel(settings.panelStyle)}\`\n` +
          `- __Banner:__ ${settings.bannerURL ? 'Set' : '*Not set*'}`,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`__${settings.games.length}/${MAX_GAMES} games__`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(lines));
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(SETUP_GAMEFINDER_ADD_BUTTON)
        .setLabel('Add')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(settings.games.length >= MAX_GAMES),
      new ButtonBuilder()
        .setCustomId(SETUP_GAMEFINDER_REMOVE_BUTTON)
        .setLabel('Remove')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(settings.games.length === 0),
      new ButtonBuilder().setCustomId(SETUP_GAMEFINDER_SETTINGS_BUTTON).setLabel('Settings').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(SETUP_GAMEFINDER_SEND_BUTTON)
        .setLabel('Send')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(settings.games.length === 0),
    ),
  );
  return toPayload(container);
}

export function buildGameFinderAddModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_GAMEFINDER_ADD_MODAL)
    .setTitle('Add Game')
    .addLabelComponents(
      new LabelBuilder().setLabel('Role').setDescription('The role tied to this game').setRoleSelectMenuComponent((select) =>
        select.setCustomId('role').setMinValues(1).setMaxValues(1).setRequired(true),
      ),
      new LabelBuilder().setLabel('Name').setTextInputComponent((input) =>
        input.setCustomId('name').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true).setPlaceholder('e.g. Valorant'),
      ),
      new LabelBuilder().setLabel('Emoji').setDescription('Optional — a normal emoji or a custom one like <:name:id>').setTextInputComponent((input) =>
        input.setCustomId('emoji').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('Put your emoji'),
      ),
    );
}

export function buildGameFinderRemoveModal(games: readonly GameFinderGame[]): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_GAMEFINDER_REMOVE_MODAL)
    .setTitle('Remove Game')
    .addLabelComponents(
      new LabelBuilder().setLabel('Game').setStringSelectMenuComponent((select) => {
        select.setCustomId('game').setMinValues(1).setMaxValues(1);
        for (const game of games) {
          const option = new StringSelectMenuOptionBuilder().setLabel(game.name.slice(0, 100)).setValue(game.id).setDescription(`Role-linked game`);
          const emoji = parsedEmoji(game.emoji);
          if (emoji) option.setEmoji(emoji);
          select.addOptions(option);
        }
        return select;
      }),
    );
}

export function buildGameFinderSettingsModal(settings: GameFinderSettings): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_GAMEFINDER_SETTINGS_MODAL)
    .setTitle('Game Finder Settings')
    .addLabelComponents(
      new LabelBuilder().setLabel('Cooldown').setDescription('How long members wait between tags, e.g. 30m, 1h, 10s').setTextInputComponent((input) =>
        input
          .setCustomId('cooldown')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(10)
          .setRequired(true)
          .setValue(formatDuration(settings.cooldownMs))
          .setPlaceholder('e.g. 30m'),
      ),
      new LabelBuilder().setLabel('Panel Channel').setDescription('Where the clickable game list is posted').setChannelSelectMenuComponent((select) => {
        select.setCustomId('panel_channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true);
        if (settings.panelChannelId) select.setDefaultChannels(settings.panelChannelId);
        return select;
      }),
      new LabelBuilder().setLabel('Manager Role').setDescription('Optional — gets 50% of the normal cooldown').setRoleSelectMenuComponent((select) => {
        select.setCustomId('manager_role').setMinValues(0).setMaxValues(1).setRequired(false);
        if (settings.managerRoleId) select.setDefaultRoles(settings.managerRoleId);
        return select;
      }),
      new LabelBuilder().setLabel('Panel Style').setDescription('How the public game list looks').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('panel_style')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Buttons').setValue('buttons').setDescription('One button per game').setDefault(settings.panelStyle !== 'select'),
            new StringSelectMenuOptionBuilder().setLabel('Select Menu').setValue('select').setDescription('A dropdown to pick a game').setDefault(settings.panelStyle === 'select'),
          ),
      ),
      new LabelBuilder().setLabel('Banner').setDescription('Optional — shown above the game list; leave empty to keep the current one').setFileUploadComponent((upload) =>
        upload.setCustomId('banner').setMinValues(0).setMaxValues(1).setRequired(false),
      ),
    );
}

function gameTagButton(game: GameFinderGame): ButtonBuilder {
  const button = new ButtonBuilder().setCustomId(`${GAMEFINDER_TAG_PREFIX}${game.id}`).setLabel(game.name.slice(0, 80)).setStyle(ButtonStyle.Secondary);
  const emoji = parsedEmoji(game.emoji);
  if (emoji) button.setEmoji(emoji);
  return button;
}

function gameSelectMenu(games: readonly GameFinderGame[]): StringSelectMenuBuilder {
  const select = new StringSelectMenuBuilder().setCustomId(GAMEFINDER_TAG_SELECT_ID).setPlaceholder('Choose a game to tag').setMinValues(1).setMaxValues(1);
  for (const game of games.slice(0, 25)) {
    const option = new StringSelectMenuOptionBuilder().setLabel(game.name.slice(0, 100)).setValue(game.id);
    const emoji = parsedEmoji(game.emoji);
    if (emoji) option.setEmoji(emoji);
    select.addOptions(option);
  }
  return select;
}

export function gameFinderPanel(games: readonly GameFinderGame[], panelStyle: GameFinderPanelStyle, bannerURL?: string): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`## ${GAMEFINDER_ICON} Game Finder`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('-# Pick a game below to tag it in your current voice channel.'));

  if (bannerURL) {
    container
      .addSeparatorComponents(sep())
      .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerURL).setDescription('Game Finder banner')));
  }

  if (panelStyle === 'select') {
    container.addSeparatorComponents(sep()).addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(gameSelectMenu(games)));
  } else {
    for (const row of chunk(games, 5)) {
      container.addSeparatorComponents(sep()).addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(row.map(gameTagButton)));
    }
  }
  return toPayload(container);
}
