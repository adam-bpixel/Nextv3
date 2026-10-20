import type { Command } from '../../../core/types';

const command: Command = {
  name: "unban",
  aliases: [],
  description: "Unbans a user from the server.",
  usage: "<user ID> [reason]",
  category: "moderation",
  logic: "unban",
  ai: null,
  permissions: ["ban_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/unban.json",
};

export = command;
