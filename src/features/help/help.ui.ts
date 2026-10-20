import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, type APIMessageTopLevelComponent } from 'discord.js';
import config from '../../core/config';
import type { BotClient } from '../../core/client';
import type { ReplyPayload } from '../../core/context';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD, HELP_CATEGORY_ICONS } from '../../core/emojis';
import { cachedColor } from '../theme/theme.model';

export const HELP_SELECT_ID = 'help_select:';
export const HELP_NAV_PREFIX = 'help_nav:';
const CLANS_VALUE = 'clan_commands';
const SLASH_VALUE = 'setup_slash_commands';
const PAGE_SIZE = 5;
const footer = (botName: string): string => `-# © 2025 ${botName} Bot, Inc. All rights reserved`;
const SEPARATOR = { type: 14, spacing: 1, divider: true };

const DEFAULT_CATEGORY_ICON = '📁';

function categoryIcon(value: string): string {
  return HELP_CATEGORY_ICONS[value] ?? DEFAULT_CATEGORY_ICON;
}

function categoryEmojiOption(value: string): { id: string; name: string; animated?: boolean } | { name: string } {
  const match = /^<(a)?:(\w+):(\d+)>$/.exec(HELP_CATEGORY_ICONS[value] ?? '');
  if (!match) return { name: DEFAULT_CATEGORY_ICON };
  const [, animated, name, id] = match;
  return { id, name: name ?? 'icon', animated: Boolean(animated) };
}

interface CommandEntry {
  name: string;
  description: string;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

const CLAN_COMMANDS: Record<string, [string, string][]> = {
  Member: [
    ['clans', 'List clans in this server.'],
    ['claninfo', 'Show your clan or a clan by ID.'],
    ['leave', 'Leave your current clan.'],
  ],
  'Co-Leader': [
    ['adduser', 'Add a member to your clan.'],
    ['removeuser', 'Remove a member from your clan.'],
  ],
  Leader: [
    ['addcoleader', 'Promote a clan member to co-leader.'],
    ['removecoleader', 'Demote a co-leader to a clan member.'],
    ['switchleader', 'Transfer clan leadership.'],
    ['clanwarnings', 'View clan warnings.'],
  ],
  Manager: [
    ['createclan', 'Create a clan and assign its leader.'],
    ['deleteclan', 'Delete a clan and remove its role.'],
    ['clanupdate', 'Edit a clan name, limits, tag, color, or voice channel.'],
    ['forceadd', 'Move a user into a clan as a member.'],
    ['warnclan', 'Issue a warning to a clan.'],
    ['clearwarnclan', 'Clear warnings recorded for a clan.'],
  ],
};

export function helpNavCustomId(ownerId: string, value: string, page: number): string {
  return `${HELP_NAV_PREFIX}${ownerId}:${page}:${value}`;
}

export function parseHelpNavCustomId(customId: string): { ownerId: string; page: number; value: string } | null {
  const [ownerId, pageText, ...valueParts] = customId.slice(HELP_NAV_PREFIX.length).split(':');
  const page = Number(pageText);
  const value = valueParts.join(':');
  if (!ownerId || !value || !Number.isFinite(page)) return null;
  return { ownerId, page, value };
}

function categoriesOf(client: BotClient, viewerId?: string): Map<string, CommandEntry[]> {
  const categories = new Map<string, CommandEntry[]>();
  for (const command of client.commands.values()) {
    if (!command.category) continue;
    if (command.ownerOnly && viewerId !== config.ownerId) continue;
    const entries = categories.get(command.category) ?? [];
    entries.push({ name: command.name, description: command.description });
    categories.set(command.category, entries);
  }
  for (const entries of categories.values()) entries.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}

function slashEntries(client: BotClient): CommandEntry[] {
  return [...client.slashCommands.values()]
    .filter((command) => command.menuType === 'slash' && command.description)
    .map((command) => ({ name: command.path, description: command.description }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function clanEntries(): CommandEntry[] {
  return Object.entries(CLAN_COMMANDS).flatMap(([role, commands]) =>
    commands.map(([name, description]) => ({ name, description: `**${role}** — ${description}` })),
  );
}

function slashEntryLine(client: BotClient, entry: CommandEntry): string {
  const rootName = entry.name.split(' ')[0] ?? entry.name;
  const commandId = client.application?.commands.cache.find((registered) => registered.name === rootName)?.id;
  const mention = commandId ? `</${entry.name}:${commandId}>` : `\`/${entry.name.replace(/[ _]+/g, ' ')}\``;
  return `- ${mention}\n  ⤷ ${entry.description || 'No description'}`;
}

function accentColor(guildId?: string | null): number {
  return (guildId ? cachedColor(guildId) : undefined) ?? config.color;
}

function container(components: object[], accent: number): APIMessageTopLevelComponent[] {
  return [{ type: 17, accent_color: accent, spoiler: false, components }] as unknown as APIMessageTopLevelComponent[];
}

function categoryOptions(client: BotClient, viewerId: string): { label: string; value: string; description: string; emoji: ReturnType<typeof categoryEmojiOption> }[] {
  const options = [...categoriesOf(client, viewerId).keys()]
    .filter((name) => name !== 'clans' && name !== CLANS_VALUE && name !== SLASH_VALUE)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ label: name, value: name, description: `Show commands in ${name} category`, emoji: categoryEmojiOption(name) }));
  options.push(
    { label: 'Clan Commands', value: CLANS_VALUE, description: 'Show commands in clan category', emoji: categoryEmojiOption(CLANS_VALUE) },
    { label: 'Setup Slash Commands', value: SLASH_VALUE, description: 'Show commands in slash category', emoji: categoryEmojiOption(SLASH_VALUE) },
  );
  return options;
}

export function helpMenu(client: BotClient, ownerId: string, guildId?: string | null): ReplyPayload {
  const options = categoryOptions(client, ownerId);
  const botName = client.user?.username ?? config.botName;
  const botAvatar = client.user?.displayAvatarURL({ extension: 'png', size: 128 });
  const contactUrl = config.ownerId ? `https://discord.com/users/${config.ownerId}` : '';
  const linkButtons = [
    ...(isHttpUrl(config.supportServerUrl) ? [{ type: 2, style: 5, label: 'Support', url: config.supportServerUrl }] : []),
    ...(isHttpUrl(contactUrl) ? [{ type: 2, style: 5, label: 'Contact me', url: contactUrl }] : []),
  ];
  const intro = [
    `- -# **__${botName}__**`,
    '- -# **__Your all-in-one bot for moderation, verification, utility, voice, games, and clan management.__**',
    '- -# **__Choose a category below to explore commands.__**',
  ].join('\n');
  const introSection = botAvatar
    ? {
        type: 9,
        components: [{ type: 10, content: intro }],
        accessory: { type: 11, media: { url: botAvatar } },
      }
    : { type: 10, content: intro };
  return {
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
    components: container(
      [
        { type: 10, content: `# ${botName} Help Menu` },
        SEPARATOR,
        introSection,
        SEPARATOR,
        {
          type: 1,
          components: [{ type: 3, custom_id: `${HELP_SELECT_ID}${ownerId}`, placeholder: 'Select a category', min_values: 1, max_values: 1, options: options.slice(0, 25) }],
        },
        ...(linkButtons.length ? [SEPARATOR, { type: 1, components: linkButtons }] : []),
        SEPARATOR,
        { type: 10, content: footer(botName) },
      ],
      accentColor(guildId),
    ),
  };
}

export function helpCategory(
  client: BotClient,
  value: string,
  guildId: string | null | undefined,
  prefix: string,
  viewerId: string,
  page = 0,
): ReplyPayload {
  const botName = client.user?.username ?? config.botName;

  let label = value;
  let entries: CommandEntry[];
  let formatEntry: (entry: CommandEntry) => string;

  if (value === CLANS_VALUE) {
    label = 'Clan Commands';
    entries = clanEntries();
    formatEntry = (entry) => `- \`${prefix}${entry.name}\`\n  ⤷ ${entry.description}`;
  } else if (value === SLASH_VALUE) {
    label = 'Slash Commands';
    entries = slashEntries(client);
    formatEntry = (entry) => slashEntryLine(client, entry);
  } else {
    entries = categoriesOf(client, viewerId).get(value) ?? [];
    formatEntry = (entry) => `- \`${prefix}${entry.name}\`\n  ⤷ ${entry.description || 'No description'}`;
  }

  const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 0), pages - 1);
  const shown = entries.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const body = shown.length ? shown.map(formatEntry).join('\n\n') : 'No commands found in this category.';

  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(helpNavCustomId(viewerId, value, safePage - 1))
      .setEmoji(ARROW_LEFT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage <= 0),
    new ButtonBuilder()
      .setCustomId(helpNavCustomId(viewerId, value, safePage + 1))
      .setEmoji(ARROW_RIGHT_GOLD)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= pages - 1),
  );

  const categorySelectRow = {
    type: 1,
    components: [
      {
        type: 3,
        custom_id: `${HELP_SELECT_ID}${viewerId}`,
        placeholder: 'Switch category',
        min_values: 1,
        max_values: 1,
        options: categoryOptions(client, viewerId).slice(0, 25),
      },
    ],
  };

  return {
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
    components: container(
      [
        { type: 10, content: `# ${categoryIcon(value)} ${label} Commands` },
        SEPARATOR,
        { type: 10, content: `Page ${safePage + 1}/${pages}` },
        SEPARATOR,
        { type: 10, content: body },
        SEPARATOR,
        navRow.toJSON(),
        categorySelectRow,
        SEPARATOR,
        { type: 10, content: footer(botName) },
      ],
      accentColor(guildId),
    ),
  };
}
