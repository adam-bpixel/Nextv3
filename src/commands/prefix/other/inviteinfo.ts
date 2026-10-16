import type { Command } from '../../../core/types';

const command: Command = {
  name: "inviteinfo",
  aliases: [],
  description: "Show info about a server invite with server avatar (requires invite code or link)",
  usage: "<invite>",
  category: "Information",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/inviteinfo.json",
};

export = command;
