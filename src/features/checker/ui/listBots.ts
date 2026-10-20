import { ContainerBuilder } from 'discord.js';
import config from '../../../core/config';
import { SERVERS_ICON } from '../../../core/emojis';
import type { BotEntry, GuildBotAudit } from '../adminAudit';
import { type CheckerPage, clampIndex, emptyPage, headerSection, navRow, sep, text, toPage } from './shared';

export const BOTS_PER_PAGE = 3;

function botBlock(bot: BotEntry): string {
  const memberLine = `- __Bot:__ **[${bot.displayName}](https://discord.com/users/${bot.id})**`;
  const highestRole = bot.highestRoleName ? `\`${bot.highestRoleName}\`` : '*None*';
  return `${memberLine}\n- __Status:__ \`Bot\`\n- __Highest Role:__ ${highestRole}\n- __ID:__ \`${bot.id}\``;
}

export function listBotsPage(audit: GuildBotAudit, index: number, invokerId: string): CheckerPage {
  if (!audit.bots.length) {
    return emptyPage(`${SERVERS_ICON} __Bot list — ${audit.name}__`, `No bots found in **${audit.name}**.`, audit.iconURL);
  }

  const totalPages = Math.max(1, Math.ceil(audit.bots.length / BOTS_PER_PAGE));
  const safeIndex = clampIndex(index, totalPages);
  const start = safeIndex * BOTS_PER_PAGE;
  const shown = audit.bots.slice(start, start + BOTS_PER_PAGE);
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${SERVERS_ICON} __Bot list — ${audit.name}__`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`Page ${safeIndex + 1}/${totalPages}`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(
        `- __Server ID:__ \`${audit.id}\`\n` +
          `- __Owner:__ <@${audit.ownerId}>\n` +
          `- __Members:__ \`${audit.memberCount.toLocaleString()}\`\n` +
          `- __Bots:__ \`${audit.bots.length}\``,
        audit.iconURL,
      ),
    )
    .addSeparatorComponents(sep());

  shown.forEach((bot, idx) => {
    container.addSectionComponents(headerSection(botBlock(bot), bot.avatarURL));
    if (idx < shown.length - 1) container.addSeparatorComponents(sep());
  });

  if (totalPages > 1) {
    container.addSeparatorComponents(sep()).addActionRowComponents(navRow('lb', invokerId, audit.id, safeIndex, totalPages));
  }

  return toPage(container);
}
