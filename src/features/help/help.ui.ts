import { MessageFlags, type APIMessageTopLevelComponent } from 'discord.js';
import config from '../../core/config';
import type { BotClient } from '../../core/client';
import type { ReplyPayload } from '../../core/context';

export const HELP_SELECT_ID = 'help_select';
const CLANS_VALUE = 'clans';
const SLASH_VALUE = 'slash';
const ACCENT_COLOR = config.color;
const TEXT_LIMIT = 3900;
const FOOTER = '-# © 2025 NextGen Bot, Inc. All rights reserved';
const SEPARATOR = { type: 14, spacing: 1, divider: true };

const CLAN_COMMANDS: Record<string, [string, string][]> = {
  Member: [
    ['clan-info', 'Show information about your clan or a specific clan ID.'],
    ['help', 'Show the interactive clan help menu.'],
    ['leave', 'Leave your current clan.'],
    ['member-info', 'Show clan information for a specific member.'],
    ['my-clan', 'Show details about your current clan.'],
    ['stats', 'Show overview statistics for your clan.'],
    ['top', 'Show clan members ranked by total voice activity.'],
    ['top-clans', 'Show all clans ranked by total voice activity.'],
    ['voice-card', 'Show a card of your clan voice time and progress toward the goal.'],
  ],
  'Co-Leader': [
    ['add', 'Invite a new member to your clan.'],
    ['members', 'List active members in your clan.'],
    ['nickname', 'Change the nickname of a manageable clan member.'],
    ['remove', 'Remove a clan member you are allowed to manage.'],
  ],
  Leader: [
    ['add-coleader', 'Promote a clan member to co-leader after confirmation.'],
    ['dm-clan', 'Send a clan-wide DM (up to 3 per clan every 24 hours).'],
    ['remove-coleader', 'Demote a co-leader back to a normal member.'],
    ['remove-tag', 'Remove the saved clan tag and strip it from members.'],
    ['set-avatar', 'Store a clan avatar image URL or attachment.'],
    ['set-banner', 'Store a clan banner image URL or attachment.'],
    ['set-tag', 'Set the clan nickname tag and format.'],
    ['transfer', 'Transfer clan leadership to one of your co-leaders.'],
  ],
  Manager: [
    ['autosetup', 'Create the missing clan leader/co-leader roles and clan categories.'],
    ['create', 'Create a new clan and assign its leader.'],
    ['delete', 'Delete an existing clan after confirmation.'],
    ['edit', 'Edit clan channels, leader, name, or attached role.'],
    ['force-add', 'Force add a user to a clan while respecting the one-clan rule.'],
    ['manager-role', 'Add, remove, or list clan manager roles.'],
    ['set-clan', 'Import an existing role as a clan.'],
    ['set-prefix', 'Change the clan command prefix.'],
    ['setup', 'Configure clan categories, roles, and logs.'],
    ['sync', 'Repair missing clan roles, channels, and role assignments.'],
  ],
};

const line = (label: string, description: string): string => `\` ⛥ - ${label} \` ${description || 'No description'}`;

function categoriesOf(client: BotClient): Map<string, string[]> {
  const categories = new Map<string, string[]>();
  for (const command of client.commands.values()) {
    if (!command.category) continue;
    const lines = categories.get(command.category) ?? [];
    lines.push(line(`${config.prefix}${command.name}`, command.description));
    categories.set(command.category, lines);
  }
  for (const lines of categories.values()) lines.sort((a, b) => a.localeCompare(b));
  return categories;
}

function slashLines(client: BotClient): string[] {
  return [...client.slashCommands.values()]
    .filter((command) => command.menuType === 'slash' && command.description)
    .map((command) => `\`/${command.path.replace(/[ _]+/g, ' ')}\` ${command.description}`)
    .sort((a, b) => a.localeCompare(b));
}

function clanLines(): string[] {
  return Object.entries(CLAN_COMMANDS).flatMap(([role, commands], index) => [
    ...(index ? [''] : []),
    `**${role}**`,
    ...commands.map(([name, description]) => line(`c!${name}`, description)),
  ]);
}

function chunk(lines: string[]): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const entry of lines) {
    if (current && current.length + entry.length + 1 > TEXT_LIMIT) {
      chunks.push(current);
      current = '';
    }
    current = current ? `${current}\n${entry}` : entry;
  }
  if (current) chunks.push(current);
  return chunks;
}

function container(components: object[]): APIMessageTopLevelComponent[] {
  return [{ type: 17, accent_color: ACCENT_COLOR, spoiler: false, components }] as unknown as APIMessageTopLevelComponent[];
}

export function helpMenu(client: BotClient): ReplyPayload {
  const options = [...categoriesOf(client).keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ label: name, value: name, description: `Show commands in ${name} category` }));
  options.push(
    { label: 'Clan Commands', value: CLANS_VALUE, description: 'Show commands in clan category' },
    { label: 'Setup Slash Commands', value: SLASH_VALUE, description: 'Show commands in slash category' },
  );
  const botName = client.user?.username ?? 'NextGen vPro';
  return {
    flags: MessageFlags.IsComponentsV2,
    components: container([
      { type: 10, content: `# ${botName} Help Menu` },
      SEPARATOR,
      {
        type: 1,
        components: [{ type: 3, custom_id: HELP_SELECT_ID, placeholder: 'Select a category', min_values: 1, max_values: 1, options: options.slice(0, 25) }],
      },
      SEPARATOR,
      { type: 10, content: FOOTER },
    ]),
  };
}

export function helpCategory(client: BotClient, value: string): ReplyPayload {
  let title = `# 📁 Setup ${value} Commands`;
  let lines: string[];
  if (value === CLANS_VALUE) {
    title = '# 📁 Clan Commands';
    lines = clanLines();
  } else if (value === SLASH_VALUE) {
    lines = slashLines(client);
  } else {
    lines = categoriesOf(client).get(value) ?? [];
  }
  const bodies = lines.length ? chunk(lines) : ['No commands found in this category.'];
  return {
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: container([
      { type: 10, content: title },
      SEPARATOR,
      ...bodies.map((content) => ({ type: 10, content })),
      SEPARATOR,
      { type: 10, content: FOOTER },
    ]),
  };
}
