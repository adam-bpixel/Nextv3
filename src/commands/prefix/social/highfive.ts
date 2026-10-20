import type { Command } from '../../../core/types';

const command: Command = {
  name: "highfive",
  aliases: [],
  description: "Give someone a high five.",
  usage: "[user mention or ID]",
  category: "social",
  logic: "highfive",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
