import type { Command } from '../../../core/types';

const command: Command = {
  name: "timeout",
  aliases: [],
  description: "Timeouts a user in the server.",
  usage: "<user mention or ID> <duration> [reason] (e.g., 1h, 30m, 7d)",
  category: "moderation",
  logic: "timeout",
  ai: null,
  permissions: ["moderate_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/timeout.json",
};

export = command;
