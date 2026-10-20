import type { Command } from '../../../core/types';

const command: Command = {
  name: "tictactoe",
  aliases: [],
  description: "Play tic-tac-toe against the bot or challenge another member.",
  usage: "[@member]",
  category: "games",
  logic: "tictactoe",
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
