import type { Command } from '../../../core/types';

const command: Command = {
  name: "guessnumber",
  aliases: [],
  description: "Guess the hidden number in one shot.",
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
  recordingFile: "prefix/guessnumber.json",
};

export = command;
