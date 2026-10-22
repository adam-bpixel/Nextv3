import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
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
import { MAX_TICKET_CATEGORIES, type PanelText, type TicketCategory, type TicketSettings } from './setup.model';
import { LOG_CHANNEL_TYPES, chunk, fillPanelTemplate, panelIntroSection, parsedEmoji, sep, serverLinkButtonRow, text, toPayload } from './setup.ui.shared';

export const SETUP_TICKET_BUTTON = 'setup:ticket:view:';
export const SETUP_TICKET_ADD_BUTTON = 'setup:ticket:add';
export const SETUP_TICKET_REMOVE_BUTTON = 'setup:ticket:remove';
export const SETUP_TICKET_EDIT_BUTTON = 'setup:ticket:edit';
export const SETUP_TICKET_EDIT_BACK_BUTTON = 'setup:ticket:edit:back';
export const SETUP_TICKET_SEND_BUTTON = 'setup:ticket:send';
export const SETUP_TICKET_CUSTOMIZE_BUTTON = 'setup:ticket:customize';
export const SETUP_TICKET_ADD_MODAL = 'setup:ticket:modal:add';
export const SETUP_TICKET_REMOVE_MODAL = 'setup:ticket:modal:remove';
export const SETUP_TICKET_SEND_MODAL = 'setup:ticket:modal:send';
export const SETUP_TICKET_CUSTOMIZE_MODAL = 'setup:ticket:modal:customize';
export const SETUP_TICKET_EDIT_PICK_PREFIX = 'setup:ticket:edit:pick:';
export const SETUP_TICKET_EDIT_MODAL_PREFIX = 'setup:ticket:modal:edit:';
export const TICKET_OPEN_PREFIX = 'setup:ticket:open:';
export const TICKET_OPEN_SELECT_ID = `${TICKET_OPEN_PREFIX}select`;
export const TICKET_CLOSE_BUTTON = 'setup:ticket:close';

function categoryLine(category: TicketCategory): string {
  const emoji = category.emoji ? `${category.emoji} ` : '';
  const description = category.description ? ` : \`${category.description}\`` : '';
  return `- ${emoji}**${category.name}**${description}`;
}

export function ticketCategoriesView(categories: readonly TicketCategory[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Ticket Categories'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`__${categories.length}/${MAX_TICKET_CATEGORIES} categories__`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(categories.length ? categories.map(categoryLine).join('\n') : '- No categories yet. Use **Add Category** to create one.'),
    );
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(SETUP_TICKET_ADD_BUTTON)
        .setLabel('Add')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categories.length >= MAX_TICKET_CATEGORIES),
      new ButtonBuilder()
        .setCustomId(SETUP_TICKET_REMOVE_BUTTON)
        .setLabel('Remove')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categories.length === 0),
      new ButtonBuilder()
        .setCustomId(SETUP_TICKET_EDIT_BUTTON)
        .setLabel('Edit')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categories.length === 0),
      new ButtonBuilder()
        .setCustomId(SETUP_TICKET_SEND_BUTTON)
        .setLabel('Send')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categories.length === 0),
    ),
  );
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_TICKET_CUSTOMIZE_BUTTON).setLabel('Customize Text').setStyle(ButtonStyle.Secondary),
    ),
  );
  return toPayload(container);
}

export function ticketEditPickerView(categories: readonly TicketCategory[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Edit Ticket Category'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('- __Choose which category to edit.__'));
  for (const row of chunk(categories, 5)) {
    container.addSeparatorComponents(sep()).addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(row.map(editPickButton)));
  }
  container
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(SETUP_TICKET_EDIT_BACK_BUTTON).setLabel('Back').setStyle(ButtonStyle.Secondary)),
    );
  return toPayload(container);
}

function editPickButton(category: TicketCategory): ButtonBuilder {
  const button = new ButtonBuilder()
    .setCustomId(`${SETUP_TICKET_EDIT_PICK_PREFIX}${category.id}`)
    .setLabel(category.name.slice(0, 80))
    .setStyle(ButtonStyle.Secondary);
  const emoji = parsedEmoji(category.emoji);
  if (emoji) button.setEmoji(emoji);
  return button;
}

export function buildTicketCategoryAddModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_TICKET_ADD_MODAL)
    .setTitle('Add Ticket Category')
    .addLabelComponents(
      new LabelBuilder().setLabel('Name').setTextInputComponent((input) =>
        input.setCustomId('name').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true).setPlaceholder('e.g. General Support'),
      ),
      new LabelBuilder().setLabel('Description').setDescription('Optional — shown next to the category').setTextInputComponent((input) =>
        input.setCustomId('description').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('What this category is for'),
      ),
      new LabelBuilder().setLabel('Emoji').setDescription('Optional — a normal emoji or a custom one like <:name:id>').setTextInputComponent((input) =>
        input.setCustomId('emoji').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('Put your emoji'),
      ),
    );
}

export function buildTicketCategoryRemoveModal(categories: readonly TicketCategory[]): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_TICKET_REMOVE_MODAL)
    .setTitle('Remove Ticket Category')
    .addLabelComponents(
      new LabelBuilder().setLabel('Category').setStringSelectMenuComponent((select) => {
        select.setCustomId('category').setMinValues(1).setMaxValues(1);
        for (const category of categories) {
          const option = new StringSelectMenuOptionBuilder().setLabel(category.name.slice(0, 100)).setValue(category.id);
          if (category.description) option.setDescription(category.description.slice(0, 100));
          const emoji = parsedEmoji(category.emoji);
          if (emoji) option.setEmoji(emoji);
          select.addOptions(option);
        }
        return select;
      }),
    );
}

export function buildTicketCategoryEditModal(category: TicketCategory): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${SETUP_TICKET_EDIT_MODAL_PREFIX}${category.id}`)
    .setTitle('Edit Ticket Category')
    .addLabelComponents(
      new LabelBuilder().setLabel('Name').setTextInputComponent((input) =>
        input.setCustomId('name').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true).setValue(category.name),
      ),
      new LabelBuilder().setLabel('Description').setDescription('Optional — shown next to the category').setTextInputComponent((input) => {
        input.setCustomId('description').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false);
        return category.description ? input.setValue(category.description) : input;
      }),
      new LabelBuilder().setLabel('Emoji').setDescription('Optional — a normal emoji or a custom one like <:name:id>').setTextInputComponent((input) => {
        input.setCustomId('emoji').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('Put your emoji');
        return category.emoji ? input.setValue(category.emoji) : input;
      }),
    );
}

export function buildTicketPanelTextModal(current?: PanelText): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_TICKET_CUSTOMIZE_MODAL)
    .setTitle('Customize Panel Text')
    .addLabelComponents(
      new LabelBuilder().setLabel('Title').setDescription('Leave empty for the default. Use {server} for the server name.').setTextInputComponent((input) => {
        input.setCustomId('title').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('{server} • Ticket Support');
        return current?.title ? input.setValue(current.title) : input;
      }),
      new LabelBuilder().setLabel('Text').setDescription('Leave empty for the default. Use {server} for the server name.').setTextInputComponent((input) => {
        input
          .setCustomId('text')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(500)
          .setRequired(false)
          .setPlaceholder('Pick a category below and our team will help you out.');
        return current?.text ? input.setValue(current.text) : input;
      }),
    );
}

export function buildTicketSendModal(settings?: TicketSettings): ModalBuilder {
  const isMenu = settings?.panelStyle === 'menu';
  return new ModalBuilder()
    .setCustomId(SETUP_TICKET_SEND_MODAL)
    .setTitle('Send Ticket Panel')
    .addLabelComponents(
      new LabelBuilder().setLabel('Ticket Category').setDescription('Where new ticket channels are created').setChannelSelectMenuComponent((select) => {
        select.setCustomId('ticket_category').setChannelTypes(ChannelType.GuildCategory).setMinValues(1).setMaxValues(1).setRequired(true);
        if (settings?.categoryId) select.setDefaultChannels(settings.categoryId);
        return select;
      }),
      new LabelBuilder().setLabel('Panel Channel').setDescription('Where the ticket panel will be posted').setChannelSelectMenuComponent((select) => {
        select.setCustomId('panel_channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true);
        if (settings?.panelChannelId) select.setDefaultChannels(settings.panelChannelId);
        return select;
      }),
      new LabelBuilder().setLabel('Log Channel').setDescription('Where ticket logs are sent').setChannelSelectMenuComponent((select) => {
        select.setCustomId('log_channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true);
        if (settings?.logChannelId) select.setDefaultChannels(settings.logChannelId);
        return select;
      }),
      new LabelBuilder().setLabel('Panel Style').setDescription('Buttons or a dropdown menu').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('panel_style')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Buttons').setValue('button').setDescription('A row of buttons, one per category').setDefault(!isMenu),
            new StringSelectMenuOptionBuilder().setLabel('Select Menu').setValue('menu').setDescription('A single dropdown with every category').setDefault(isMenu),
          ),
      ),
      new LabelBuilder().setLabel('Panel Image').setDescription('Optional — upload a replacement; leave empty to keep the current image').setFileUploadComponent((upload) =>
        upload.setCustomId('panel_image').setMinValues(0).setMaxValues(1).setRequired(false),
      ),
    );
}

function categoryButton(category: TicketCategory): ButtonBuilder {
  const button = new ButtonBuilder().setCustomId(`${TICKET_OPEN_PREFIX}${category.id}`).setLabel(category.name.slice(0, 80)).setStyle(ButtonStyle.Secondary);
  const emoji = parsedEmoji(category.emoji);
  if (emoji) button.setEmoji(emoji);
  return button;
}

function categorySelectMenu(categories: readonly TicketCategory[]): StringSelectMenuBuilder {
  const select = new StringSelectMenuBuilder().setCustomId(`${TICKET_OPEN_PREFIX}select`).setPlaceholder('Choose a category...').setMinValues(1).setMaxValues(1);
  for (const category of categories) {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(category.name.slice(0, 100))
      .setValue(category.id)
      .setDescription((category.description ?? category.name).slice(0, 100));
    const emoji = parsedEmoji(category.emoji);
    if (emoji) option.setEmoji(emoji);
    select.addOptions(option);
  }
  return select;
}

const DEFAULT_TICKET_TEXT = ['-# Pick a category below and our team will help you out.', '-# Choose the option that best describes what you need help with.'].join('\n');

export function ticketPanel(
  guildName: string,
  guildIconURL: string | null,
  categories: readonly TicketCategory[],
  settings: TicketSettings,
  panelText?: PanelText,
): ReplyPayload {
  const title = panelText?.title ? fillPanelTemplate(panelText.title, guildName) : `${guildName} • Ticket Support`;
  const description = panelText?.text ? fillPanelTemplate(panelText.text, guildName) : DEFAULT_TICKET_TEXT;

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addSectionComponents(panelIntroSection(guildIconURL, `## ${title}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(description))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(categories.map(categoryLine).join('\n\n') || '- No ticket categories are available yet.'))
    .addSeparatorComponents(sep());
  if (settings.panelImageURL) {
    container
      .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(settings.panelImageURL).setDescription('Ticket panel image')))
      .addSeparatorComponents(sep());
  }
  if (settings.panelStyle === 'menu') {
    container.addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(categorySelectMenu(categories)));
  } else {
    for (const buttons of chunk(categories, 5)) {
      container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.map(categoryButton)));
    }
  }
  return toPayload(container);
}

export function ticketOpenedView(userId: string, category: TicketCategory): ReplyPayload {
  const emoji = category.emoji ? `${category.emoji} ` : '';
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`## ${emoji}${category.name}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(
        [`- __Hello <@${userId}>, welcome to your ticket.__`, ...(category.description ? [`- __${category.description}__`] : [])].join('\n'),
      ),
    )
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(TICKET_CLOSE_BUTTON).setLabel('Close Ticket').setStyle(ButtonStyle.Secondary)),
    );
  return toPayload(container);
}

export interface TicketEventCardOptions {
  event: 'opened' | 'closed';
  guildName: string;
  channelId: string;
  channelName: string;
  userId: string;
  categoryName: string;
  actorId?: string;
}

export function ticketEventCard(options: TicketEventCardOptions): ReplyPayload {
  const isOpen = options.event === 'opened';
  const container = new ContainerBuilder()
    .setAccentColor(isOpen ? 0xa8e6b0 : 0xf07178)
    .addTextDisplayComponents(text(`## Ticket ${isOpen ? 'Opened' : 'Closed'}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text([
      `- **Server:** ${options.guildName}`,
      `- **Ticket:** <#${options.channelId}> (\`${options.channelName}\`)`,
      `- **User:** <@${options.userId}> (\`${options.userId}\`)`,
      `- **Category:** ${options.categoryName}`,
      ...(options.actorId ? [`- **${isOpen ? 'Opened by' : 'Closed by'}:** <@${options.actorId}>`] : []),
    ].join('\n')));
  return toPayload(container);
}

export function ticketUserNotice(options: TicketEventCardOptions, inviteURL: string | null): ReplyPayload {
  const isOpen = options.event === 'opened';
  const container = new ContainerBuilder()
    .setAccentColor(isOpen ? 0xa8e6b0 : 0xf07178)
    .addTextDisplayComponents(text(`## Your Ticket Was ${isOpen ? 'Opened' : 'Closed'}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text([
      `- __Server__ ﹕ **${options.guildName}**`,
      `- __Ticket__ ﹕ \`${options.channelName}\``,
      `- __Category__ ﹕ **${options.categoryName}**`,
      isOpen ? '- __Status__ ﹕ Your support channel is ready. You can now contact the team there.' : '- __Status__ ﹕ Your support ticket has been closed.',
    ].join('\n')));
  if (inviteURL) container.addSeparatorComponents(sep()).addActionRowComponents(serverLinkButtonRow(options.guildName, inviteURL));
  return toPayload(container);
}
