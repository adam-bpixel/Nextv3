import type { Command } from '../../../core/types';

const command: Command = {
  name: "riddle",
  aliases: [],
  description: "Solve a quick riddle.",
  usage: "",
  category: "games",
  logic: "riddle",
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
