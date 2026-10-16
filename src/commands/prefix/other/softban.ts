import type { Command } from '../../../core/types';

const command: Command = {
  name: "softban",
  aliases: [],
  description: "Ban and immediately unban a member to remove recent messages.",
  usage: "<user mention or ID> [delete days 0-7] [reason]",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/softban.json",
};

export = command;
