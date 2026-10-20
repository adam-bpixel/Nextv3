import type { Command } from '../../../core/types';

const command: Command = {
  name: "hack",
  aliases: [],
  description: "Hack a user (simulation).",
  usage: "<user mention>",
  category: "social",
  logic: "hack",
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
