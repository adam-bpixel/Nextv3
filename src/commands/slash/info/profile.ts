import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../../core/types';

const command: Command = {
  path: 'profile',
  menuType: 'slash',
  description: 'Show a member profile as an image card',
  options: [{ name: 'user', description: 'Which user to look up', type: ApplicationCommandOptionType.User, required: false }],
  logic: 'profile',
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
