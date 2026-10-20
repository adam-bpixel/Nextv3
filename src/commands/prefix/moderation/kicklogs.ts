import type { Command } from '../../../core/types';

const command: Command = {
  name: "kicklogs",
  aliases: [],
  description: "Show kick audit-log entries for a specific user.",
  usage: "<user mention or ID>",
  category: "moderation",
  logic: "kicklogs",
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
