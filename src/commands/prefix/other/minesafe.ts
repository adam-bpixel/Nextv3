import type { Command } from '../../../core/types';

const command: Command = {
  name: "minesafe",
  aliases: [],
  description: "Pick a tile and hope it is not the mine.",
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
  recordingFile: "prefix/minesafe.json",
};

export = command;
