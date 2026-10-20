import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../../core/types';

const command: Command = {
  path: 'rank',
  menuType: 'slash',
  description: "Show a member's server level, XP progress, and rank",
  options: [{ name: 'user', description: 'Which user to look up', type: ApplicationCommandOptionType.User, required: false }],
  logic: 'rank',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: 'ok',
  recordingFile: null,
};

export = command;
