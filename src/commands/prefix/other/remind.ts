import type { Command } from '../../../core/types';

const command: Command = {
  name: "remind",
  aliases: [],
  description: "Set a personal reminder.",
  usage: "<duration> <reminder text> (e.g., 1h call mom, 30m take a break)",
  category: "users",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/remind.json",
};

export = command;
