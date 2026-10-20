import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../../core/types';

const command: Command = {
  path: 'user',
  menuType: 'slash',
  description: "Show a user's profile with roles & voice info",
  options: [{ name: 'user', description: 'Which user to look up', type: ApplicationCommandOptionType.User, required: false }],
  logic: 'userinfo',
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
