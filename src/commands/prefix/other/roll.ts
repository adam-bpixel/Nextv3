import type { Command } from '../../../core/types';

const command: Command = {
  name: "roll",
  aliases: [],
  description: "Roll a dice (e.g., 1d6, 2d10). Defaults to 1d6.",
  usage: "",
  category: "fun",
  logic: "roll",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/roll.json",
};

export = command;
