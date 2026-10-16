import type { Command } from '../../../core/types';

const command: Command = {
  name: "tictactoe",
  aliases: [],
  description: "Play tic-tac-toe against the bot or challenge another member.",
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
  recordingFile: "prefix/tictactoe.json",
};

export = command;
