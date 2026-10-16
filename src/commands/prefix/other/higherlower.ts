import type { Command } from '../../../core/types';

const command: Command = {
  name: "higherlower",
  aliases: [],
  description: "Guess whether the next number is higher or lower.",
  usage: "",
  category: "fun",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/higherlower.json",
};

export = command;
