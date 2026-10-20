import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../../core/types';

const command: Command = {
  path: 'avatar',
  menuType: 'slash',
  description: "Show a user's avatar without pinging",
  options: [{ name: 'user', description: 'Whose avatar to show', type: ApplicationCommandOptionType.User, required: false }],
  logic: 'avatar',
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
