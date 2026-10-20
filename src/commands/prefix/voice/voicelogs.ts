import type { Command } from '../../../core/types';

const command: Command = {
  name: "voicelogs",
  aliases: [],
  description: "Show voice moderation audit-log entries for a specific user.",
  usage: "<user mention or ID>",
  category: "moderation",
  logic: "voicelogs",
  ai: null,
  permissions: ["view_audit_log"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
