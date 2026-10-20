import type { Command } from '../../../core/types';

const command: Command = {
  name: "ban",
  aliases: [],
  description: "Bans a user from the server.",
  usage: "<user mention or ID> [reason]",
  category: "moderation",
  logic: "ban",
  ai: null,
  permissions: ["ban_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/ban.json",
};

export = command;
