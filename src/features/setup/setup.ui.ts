import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ContainerBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import type { GuildSetup, JailSetup, VerificationSetup, WarnSetup } from './setup.model';

export const SETUP_MODAL_PREFIX = 'setup:modal:';
export const SETUP_STATUS_BUTTON = 'setup:status:view';
export type SetupSection = 'jail' | 'verification' | 'warn';

export interface SetupFieldSpec {
  id: string;
  label: string;
  kind: 'role' | 'channel';
}

const LOG_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement] as const;

const MODAL_FIELDS: Readonly<Record<SetupSection, readonly SetupFieldSpec[]>> = {
  jail: [
    { id: 'jailer_role', label: 'Jailer role', kind: 'role' },
    { id: 'jailed_role', label: 'Jailed role', kind: 'role' },
    { id: 'jail_logs_channel', label: 'Jail logs channel', kind: 'channel' },
  ],
  verification: [
    { id: 'verified_role', label: 'Verified role', kind: 'role' },
    { id: 'verified_female_role', label: 'Verified female role', kind: 'role' },
    { id: 'unverified_role', label: 'Unverified role', kind: 'role' },
    { id: 'verificator_role', label: 'Verificator role', kind: 'role' },
    { id: 'verif_logs_channel', label: 'Verification logs channel', kind: 'channel' },
  ],
  warn: [
    { id: 'first_warn_role', label: 'First warn role', kind: 'role' },
    { id: 'second_warn_role', label: 'Second warn role', kind: 'role' },
    { id: 'last_warn_role', label: 'Last warn role', kind: 'role' },
    { id: 'warner_role', label: 'Warner role', kind: 'role' },
    { id: 'warn_logs_channel', label: 'Warn logs channel', kind: 'channel' },
  ],
};

const MODAL_TITLES: Readonly<Record<SetupSection, string>> = {
  jail: 'Jail System Setup',
  verification: 'Verification System Setup',
  warn: 'Warn System Setup',
};

export function fieldsFor(section: SetupSection): readonly SetupFieldSpec[] {
  return MODAL_FIELDS[section];
}

export function buildSetupModal(section: SetupSection): ModalBuilder {
  const modal = new ModalBuilder().setCustomId(`${SETUP_MODAL_PREFIX}${section}`).setTitle(MODAL_TITLES[section]);
  for (const field of MODAL_FIELDS[section]) {
    const row = new LabelBuilder().setLabel(field.label);
    if (field.kind === 'role') {
      row.setRoleSelectMenuComponent((select) => select.setCustomId(field.id).setMinValues(1).setMaxValues(1).setRequired(true));
    } else {
      row.setChannelSelectMenuComponent((select) =>
        select.setCustomId(field.id).setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true),
      );
    }
    modal.addLabelComponents(row);
  }
  return modal;
}

const text = (content: string): TextDisplayBuilder => new TextDisplayBuilder().setContent(content);
const sep = (): SeparatorBuilder => new SeparatorBuilder();

function toPayload(container: ContainerBuilder): ReplyPayload {
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2 };
}

function card(title: string, lines: readonly string[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`## ${title}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(lines.map((line) => `- ${line}`).join('\n')));
  return toPayload(container);
}

const SECTIONS: readonly { key: SetupSection; label: string }[] = [
  { key: 'jail', label: 'Jail System' },
  { key: 'verification', label: 'Verification System' },
  { key: 'warn', label: 'Warn System' },
];

function statusSection(key: SetupSection, label: string, configured: boolean): SectionBuilder {
  return new SectionBuilder()
    .addTextDisplayComponents(text(`- __${label}__  ${configured ? '✅ Configured' : '⚠️ Not configured'}`))
    .setButtonAccessory(new ButtonBuilder().setCustomId(`${SETUP_MODAL_PREFIX}${key}`).setLabel('Configure').setStyle(ButtonStyle.Secondary));
}

export function setupOverview(setup: GuildSetup): ReplyPayload {
  const container = new ContainerBuilder().setAccentColor(config.color).addTextDisplayComponents(text('## Server Setup'));
  for (const { key, label } of SECTIONS) {
    container.addSeparatorComponents(sep()).addSectionComponents(statusSection(key, label, Boolean(setup[key])));
  }
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_STATUS_BUTTON).setLabel('Status').setStyle(ButtonStyle.Primary),
    ),
  );
  return toPayload(container);
}

export function jailSavedCard(data: JailSetup): ReplyPayload {
  return card('Jail System — Saved', [
    `Jailer role: <@&${data.jailerRoleId}>`,
    `Jailed role: <@&${data.jailedRoleId}>`,
    `Jail logs channel: <#${data.logsChannelId}>`,
  ]);
}

export function verificationSavedCard(data: VerificationSetup): ReplyPayload {
  return card('Verification System — Saved', [
    `Verified role: <@&${data.verifiedRoleId}>`,
    `Verified female role: <@&${data.verifiedFemaleRoleId}>`,
    `Unverified role: <@&${data.unverifiedRoleId}>`,
    `Verificator role: <@&${data.verificatorRoleId}>`,
    `Verification logs channel: <#${data.logsChannelId}>`,
  ]);
}

export function warnSavedCard(data: WarnSetup): ReplyPayload {
  return card('Warn System — Saved', [
    `First warn role: <@&${data.firstWarnRoleId}>`,
    `Second warn role: <@&${data.secondWarnRoleId}>`,
    `Last warn role: <@&${data.lastWarnRoleId}>`,
    `Warner role: <@&${data.warnerRoleId}>`,
    `Warn logs channel: <#${data.logsChannelId}>`,
  ]);
}
