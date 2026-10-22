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
import { APPLY_ACCEPT_ICON, APPLY_REJECT_ICON } from '../../core/emojis';
import type { ApplyCategory, ApplySettings, PanelText } from './setup.model';
import { APPLY_ACCEPT_BUTTON, APPLY_FORM_PREFIX, APPLY_OPEN_PREFIX, APPLY_OPEN_SELECT_ID, APPLY_REJECT_BUTTON } from './setup.ui.apply.views';
import { chunk, fillPanelTemplate, panelIntroSection, parsedEmoji, sep, text, toPayload } from './setup.ui.shared';

function applyPanelCategoryLine(category: ApplyCategory): string {
  const emoji = category.emoji ? `${category.emoji} ` : '';
  const description = category.description ? ` : \`${category.description}\`` : '';
  return `- ${emoji}**${category.name}**${description}`;
}

function applyCategoryButton(category: ApplyCategory): ButtonBuilder {
  const button = new ButtonBuilder().setCustomId(`${APPLY_OPEN_PREFIX}${category.id}`).setLabel(category.name.slice(0, 80)).setStyle(ButtonStyle.Secondary);
  const emoji = parsedEmoji(category.emoji);
  if (emoji) button.setEmoji(emoji);
  return button;
}

function applyCategorySelectMenu(categories: readonly ApplyCategory[]): StringSelectMenuBuilder {
  const select = new StringSelectMenuBuilder().setCustomId(APPLY_OPEN_SELECT_ID).setPlaceholder('Choose a position...').setMinValues(1).setMaxValues(1);
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

const DEFAULT_APPLY_TEXT = [
  '-# We are looking for active and respectful members who want to help our community grow.',
  '-# Choose the position that suits you, then complete the application with clear and honest answers.',
].join('\n');

export function applyPanel(
  guildName: string,
  guildIconURL: string | null,
  categories: readonly ApplyCategory[],
  settings: ApplySettings,
  panelText?: PanelText,
): ReplyPayload {
  const title = panelText?.title ? fillPanelTemplate(panelText.title, guildName) : `${guildName} • Applications`;
  const description = panelText?.text ? fillPanelTemplate(panelText.text, guildName) : DEFAULT_APPLY_TEXT;

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addSectionComponents(panelIntroSection(guildIconURL, `## ${title}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(description))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(categories.map(applyPanelCategoryLine).join('\n\n') || '- No application positions are available yet.'))
    .addSeparatorComponents(sep());
  if (settings.panelImageURL) {
    container
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(settings.panelImageURL).setDescription('Application panel image')),
      )
      .addSeparatorComponents(sep());
  }
  if (settings.panelStyle === 'menu') {
    container.addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(applyCategorySelectMenu(categories)));
  } else {
    for (const buttons of chunk(categories, 5)) {
      container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.map(applyCategoryButton)));
    }
  }
  return toPayload(container);
}

export function buildApplicationFormModal(category: ApplyCategory): ModalBuilder {
  const modal = new ModalBuilder().setCustomId(`${APPLY_FORM_PREFIX}${category.id}`).setTitle(`${category.name} Application`.slice(0, 45));
  for (const [index, question] of category.questions.entries()) {
    modal.addLabelComponents(
      new LabelBuilder().setLabel(question.slice(0, 45)).setTextInputComponent((input) =>
        input.setCustomId(`q${index}`).setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true),
      ),
    );
  }
  return modal;
}

const APPLY_PENDING_COLOR = 0xffd966;
const APPLY_ACCEPTED_COLOR = 0x57f287;
const APPLY_REJECTED_COLOR = 0xed4245;

export function applyReviewCard(
  applicantId: string,
  category: ApplyCategory,
  answers: readonly string[],
  decided?: { verdict: 'Accepted' | 'Rejected'; reviewerId: string },
): ReplyPayload {
  const accentColor = decided ? (decided.verdict === 'Accepted' ? APPLY_ACCEPTED_COLOR : APPLY_REJECTED_COLOR) : APPLY_PENDING_COLOR;
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(text(`## New Application — ${category.name}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`- __Applicant :__ <@${applicantId}>`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(category.questions.map((question, index) => `**${question}**\n${answers[index] ?? ''}`).join('\n\n')),
    );
  if (decided) {
    const verdictEmoji = decided.verdict === 'Accepted' ? APPLY_ACCEPT_ICON : APPLY_REJECT_ICON;
    container.addSeparatorComponents(sep()).addTextDisplayComponents(text(`- ${verdictEmoji} __${decided.verdict} by__ <@${decided.reviewerId}>`));
  } else {
    const acceptEmoji = parsedEmoji(APPLY_ACCEPT_ICON);
    const rejectEmoji = parsedEmoji(APPLY_REJECT_ICON);
    const acceptButton = new ButtonBuilder().setCustomId(APPLY_ACCEPT_BUTTON).setLabel('Accept').setStyle(ButtonStyle.Success);
    const rejectButton = new ButtonBuilder().setCustomId(APPLY_REJECT_BUTTON).setLabel('Reject').setStyle(ButtonStyle.Danger);
    if (acceptEmoji) acceptButton.setEmoji(acceptEmoji);
    if (rejectEmoji) rejectButton.setEmoji(rejectEmoji);
    container.addSeparatorComponents(sep()).addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, rejectButton));
  }
  return toPayload(container);
}

export function applyDecisionDM(guildName: string, categoryName: string, verdict: 'Accepted' | 'Rejected', inviteURL: string | null): ReplyPayload {
  const accentColor = verdict === 'Accepted' ? APPLY_ACCEPTED_COLOR : APPLY_REJECTED_COLOR;
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(text(`## Application ${verdict}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`- __Your **${categoryName}** application in **${guildName}** was ${verdict.toLowerCase()}.__`));
  if (inviteURL) {
    const serverButton = new ButtonBuilder().setLabel(guildName.slice(0, 80)).setStyle(ButtonStyle.Link).setURL(inviteURL);
    container.addSeparatorComponents(sep()).addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(serverButton));
  }
  return toPayload(container);
}
