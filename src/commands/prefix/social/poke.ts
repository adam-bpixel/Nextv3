import type { Command } from '../../../core/types';

const command: Command = {
  name: "poke",
  aliases: [],
  description: "Poke someone to get their attention.",
  usage: "[user mention or ID]",
  category: "social",
  logic: "poke",
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
