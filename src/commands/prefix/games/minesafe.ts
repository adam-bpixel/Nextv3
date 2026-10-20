import type { Command } from '../../../core/types';

const command: Command = {
  name: "minesafe",
  aliases: [],
  description: "Pick a tile and hope it is not the mine.",
  usage: "",
  category: "games",
  logic: "minesafe",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
