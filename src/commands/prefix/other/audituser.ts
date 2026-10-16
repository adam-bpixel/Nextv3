import type { Command } from '../../../core/types';

const command: Command = {
  name: "audituser",
  aliases: [],
  description: "Show a combined moderation audit summary for a specific user.",
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
  recordingFile: "prefix/audituser.json",
};

export = command;
