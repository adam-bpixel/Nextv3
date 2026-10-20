import type { Command } from '../../../core/types';

const command: Command = {
  name: "daily",
  aliases: [],
  description: "Claim your daily currency reward.",
  usage: "",
  category: "economy",
  logic: "daily",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 86400,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
