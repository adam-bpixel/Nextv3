import type { Command } from '../../../core/types';

const command: Command = {
  name: "rps",
  aliases: [],
  description: "Play rock paper scissors against the bot.",
  usage: "",
  category: "games",
  logic: "rps",
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
