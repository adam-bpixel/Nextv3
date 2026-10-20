import type { Command } from '../../../core/types';

const command: Command = {
  name: "check-vanity",
  aliases: [],
  description: "Check if a Discord vanity URL is available",
  usage: "<vanity code>",
  category: "Information",
  logic: "checkVanity",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: null,
};

export = command;
