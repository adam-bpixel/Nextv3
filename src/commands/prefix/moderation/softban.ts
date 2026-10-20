import type { Command } from '../../../core/types';

const command: Command = {
  name: "softban",
  aliases: [],
  description: "Ban and immediately unban a member to remove recent messages.",
  usage: "<user mention or ID> [delete days 0-7] [reason]",
  category: "moderation",
  logic: "softban",
  ai: null,
  permissions: ["ban_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
