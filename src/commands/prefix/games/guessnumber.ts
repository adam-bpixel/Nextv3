import type { Command } from '../../../core/types';

const command: Command = {
  name: "guessnumber",
  aliases: [],
  description: "Guess the hidden number in one shot.",
  usage: "",
  category: "games",
  logic: "guessnumber",
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
