import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  TextInputStyle,
} from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';

const OPEN_ID = 'owner:suggest:open';
export const SUGGEST_MODAL_ID = 'owner:suggest:submit';
export const SUGGEST_DECISION_PREFIX = 'owner:suggest:decision:';
const text = (content: string): TextDisplayBuilder => new TextDisplayBuilder().setContent(content);

export function suggestPanel(botName: string): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`## ${botName} Feature Suggestions`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text([
      '- -# **__Have an idea for the bot? Share it with us.__**',
      '- -# **__Choose the button below to send your suggestion.__**',
    ].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(OPEN_ID).setLabel('Suggest a Feature').setStyle(ButtonStyle.Secondary),
    ));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export function suggestModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SUGGEST_MODAL_ID)
    .setTitle('Suggest a Feature')
    .addLabelComponents(
      new LabelBuilder().setLabel('Feature title').setTextInputComponent((input) =>
        input.setCustomId('title').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true),
      ),
      new LabelBuilder().setLabel('Feature description').setTextInputComponent((input) =>
        input.setCustomId('description').setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true),
      ),
      new LabelBuilder().setLabel('Why would this be useful?').setTextInputComponent((input) =>
        input.setCustomId('why').setStyle(TextInputStyle.Paragraph).setMaxLength(500).setRequired(false),
      ),
    );
}

export function suggestionReview(userId: string, guildName: string, title: string, description: string, why: string): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Feature Suggestion'))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text([
      `- **From:** <@${userId}> (\`${userId}\`)`,
      `- **Server:** ${guildName}`,
      `- **Submitted:** <t:${Math.floor(Date.now() / 1000)}:R>`,
      `- **Title:** ${title}`,
      `- **Description:** ${description}`,
      ...(why ? [`- **Why:** ${why}`] : []),
    ].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`${SUGGEST_DECISION_PREFIX}accept:${userId}`).setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`${SUGGEST_DECISION_PREFIX}reject:${userId}`).setLabel('Reject').setStyle(ButtonStyle.Danger),
    ));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export function suggestionDecision(accepted: boolean, reviewer: string): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`## Suggestion ${accepted ? 'Accepted' : 'Rejected'}`))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(text(`- Reviewed by <@${reviewer}>.`));
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } };
}

export const SUGGEST_OPEN_ID = OPEN_ID;
