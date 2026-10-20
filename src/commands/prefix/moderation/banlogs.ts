import type { Command } from '../../../core/types';

const command: Command = {
  name: "banlogs",
  aliases: [],
  description: "Show ban audit-log entries for a specific user.",
  usage: "<user mention or ID>",
  category: "moderation",
  logic: "banlogs",
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
