import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../../core/types';

const command: Command = {
  path: 'banner',
  menuType: 'slash',
  description: "Show a user's banner without pinging",
  options: [{ name: 'user', description: 'Whose banner to show', type: ApplicationCommandOptionType.User, required: false }],
  logic: 'banner',
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
