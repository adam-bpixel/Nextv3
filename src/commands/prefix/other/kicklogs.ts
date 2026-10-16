import type { Command } from '../../../core/types';

const command: Command = {
  name: "kicklogs",
  aliases: [],
  description: "Show kick audit-log entries for a specific user.",
  usage: "<user mention or ID>",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/kicklogs.json",
};

export = command;
