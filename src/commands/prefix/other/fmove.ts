import type { Command } from '../../../core/types';

const command: Command = {
  name: "fmove",
  aliases: [],
  description: "Force move a member to another voice channel.",
  usage: "<member> <voice channel>",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/fmove.json",
};

export = command;
