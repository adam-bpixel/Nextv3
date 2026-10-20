import type { Command } from '../../../core/types';

const command: Command = {
  name: "fistbump",
  aliases: [],
  description: "Fist bump someone.",
  usage: "[user mention or ID]",
  category: "social",
  logic: "fistbump",
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
