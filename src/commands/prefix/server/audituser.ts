import type { Command } from '../../../core/types';

const command: Command = {
  name: "audituser",
  aliases: [],
  description: "Show a combined moderation audit summary for a specific user.",
  usage: "<user mention or ID>",
  category: "moderation",
  logic: "auditUser",
  ai: null,
  permissions: ["view_audit_log"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: null,
};

export = command;
