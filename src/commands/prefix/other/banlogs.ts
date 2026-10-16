import type { Command } from '../../../core/types';

const command: Command = {
  name: "banlogs",
  aliases: [],
  description: "Show ban audit-log entries for a specific user.",
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
  recordingFile: "prefix/banlogs.json",
};

export = command;
