import type { Command } from '../../../core/types';

const command: Command = {
  path: 'setup ticket',
  menuType: 'slash',
  description: 'Open the ticket system setup panel.',
  options: [],
  logic: 'setupTicketPanel',
  ai: null,
  permissions: ['manage_guild'],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: 'ok',
  recordingFile: null,
};

export = command;
