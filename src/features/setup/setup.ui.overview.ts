import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD } from '../../core/emojis';
import { SETUP_LOGS_BUTTON } from '../logs/logs.ui';
import { SETUP_ALTTRACKER_BUTTON } from './setup.ui.alttracker';
import { MAX_AUTO_ROLES, MAX_BLACKLISTED_CHANNELS, MAX_CHECKER_ROLES } from './setup.model';
import { SETUP_JAIL_BUTTON } from './setup.ui.jail';
import { SETUP_LEVELROLES_BUTTON } from './setup.ui.levelroles';
import { SETUP_MUTE_BUTTON } from './setup.ui.mute';
import { SETUP_VERIFICATION_BUTTON } from './setup.ui.verification';
import { SETUP_WARN_BUTTON } from './setup.ui.warn';
import { SETUP_APPLY_BUTTON } from './setup.ui.apply';
import { SETUP_AUTOREPLY_BUTTON } from './setup.ui.autoreply';
import { SETUP_AUTOROLE_BUTTON } from './setup.ui.autorole';
import { SETUP_BLACKLIST_BUTTON } from './setup.ui.blacklist';
import { SETUP_CHECKER_BUTTON } from './setup.ui.checker';
import { SETUP_CLANS_BUTTON } from './setup.ui.clans';
import { SETUP_GAMEFINDER_BUTTON } from './setup.ui.gamefinder';
import { SETUP_PREFIX_BUTTON } from './setup.ui.prefix';
import { SETUP_SELFROLE_BUTTON } from './setup.ui.selfrole';
import { sep, text, toPayload } from './setup.ui.shared';
import { SETUP_TICKET_BUTTON } from './setup.ui.ticket';

const JAIL_DESCRIPTION = 'Configure jailer roles, the jailed role, and the jail logs channel';
const VERIFICATION_DESCRIPTION = 'Configure the verified, female, and unverified roles, and verificator roles';
const WARN_DESCRIPTION = 'Configure the warning roles, warner roles, and warn logs channel';
const MUTE_DESCRIPTION = 'Configure muter roles, the muted role, and the mute logs channel';
const TICKET_DESCRIPTION = 'Configure support ticket categories for this server';
const APPLY_DESCRIPTION = 'Configure staff application categories and questions';
const AUTOREPLY_DESCRIPTION = 'Configure automatic text replies for this server';
const AUTOROLE_DESCRIPTION = `Automatically give up to ${MAX_AUTO_ROLES} roles to new members`;
const LOGS_DESCRIPTION = 'Configure which server events are logged, and where';
const SELFROLE_DESCRIPTION = 'Configure self-assignable role sections and buttons';
const LEVELROLES_DESCRIPTION = 'Give roles automatically when members reach a chat or voice level';
const CLANS_DESCRIPTION = 'Configure clan roles, voice category, logs and leaderboard';
const ALTTRACKER_DESCRIPTION = 'Flag new members whose Discord account is younger than a set age';
const GAMEFINDER_DESCRIPTION = 'Configure games, cooldown, panel channel and the game mode manager role';
const BLACKLIST_DESCRIPTION = `Block bot commands in up to ${MAX_BLACKLISTED_CHANNELS} channels`;
const PREFIX_DESCRIPTION = 'Configure the server prefix and your personal prefix';
const CHECKER_DESCRIPTION = `Choose up to ${MAX_CHECKER_ROLES} roles allowed to use checker commands`;

function featureRow(ownerId: string, buttonPrefix: string, label: string, description: string): SectionBuilder {
  return new SectionBuilder()
    .addTextDisplayComponents(text(`- __${label}__ : ${description}`))
    .setButtonAccessory(new ButtonBuilder().setCustomId(`${buttonPrefix}${ownerId}`).setLabel('Configure').setStyle(ButtonStyle.Secondary));
}

const OVERVIEW_ROW_BUILDERS: readonly ((ownerId: string) => SectionBuilder)[] = [
  (ownerId: string) => featureRow(ownerId, SETUP_JAIL_BUTTON, 'Jail System', JAIL_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_VERIFICATION_BUTTON, 'Verification System', VERIFICATION_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_MUTE_BUTTON, 'Mute System', MUTE_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_WARN_BUTTON, 'Warn System', WARN_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_TICKET_BUTTON, 'Ticket System', TICKET_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_APPLY_BUTTON, 'Apply System', APPLY_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_AUTOREPLY_BUTTON, 'Auto Reply', AUTOREPLY_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_AUTOROLE_BUTTON, 'Auto Role', AUTOROLE_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_SELFROLE_BUTTON, 'Self Roles', SELFROLE_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_LEVELROLES_BUTTON, 'Level Roles', LEVELROLES_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_LOGS_BUTTON, 'Server Logs', LOGS_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_CLANS_BUTTON, 'Clans', CLANS_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_ALTTRACKER_BUTTON, 'Alt Tracker', ALTTRACKER_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_GAMEFINDER_BUTTON, 'Game Finder', GAMEFINDER_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_BLACKLIST_BUTTON, 'Blacklist Channel', BLACKLIST_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_PREFIX_BUTTON, 'Prefix', PREFIX_DESCRIPTION),
  (ownerId: string) => featureRow(ownerId, SETUP_CHECKER_BUTTON, 'Checkers', CHECKER_DESCRIPTION),
];

const OVERVIEW_PAGE_SIZE = 5;
export const SETUP_OVERVIEW_NAV_PREFIX = 'setup:overview:';

export function setupOverviewNavCustomId(ownerId: string, page: number): string {
  return `${SETUP_OVERVIEW_NAV_PREFIX}${ownerId}:${page}`;
}

function overviewNavRow(ownerId: string, page: number, totalPages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(setupOverviewNavCustomId(ownerId, page - 1)).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
    new ButtonBuilder().setCustomId(setupOverviewNavCustomId(ownerId, page)).setLabel(`${page + 1} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder()
      .setCustomId(setupOverviewNavCustomId(ownerId, page + 1))
      .setEmoji(ARROW_RIGHT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
}

export function setupOverview(ownerId: string, page = 0): ReplyPayload {
  const totalPages = Math.max(1, Math.ceil(OVERVIEW_ROW_BUILDERS.length / OVERVIEW_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * OVERVIEW_PAGE_SIZE;
  const rows = OVERVIEW_ROW_BUILDERS.slice(start, start + OVERVIEW_PAGE_SIZE);

  const container = new ContainerBuilder().setAccentColor(config.color).addTextDisplayComponents(text('## Server Setup'));
  for (const build of rows) {
    container.addSeparatorComponents(sep()).addSectionComponents(build(ownerId));
  }
  container.addSeparatorComponents(sep()).addActionRowComponents(overviewNavRow(ownerId, safePage, totalPages));
  return toPayload(container);
}
