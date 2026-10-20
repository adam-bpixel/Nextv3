import type { Command } from '../../../core/types';

const command: Command = {
  name: 'invites',
  aliases: ['myinvites'],
  description: 'Show how many members you (or someone else) invited to this server.',
  usage: '[user mention or ID]',
  category: 'Information',
  logic: 'invites',
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: 'usage',
  recordingFile: null,
};

export = command;
