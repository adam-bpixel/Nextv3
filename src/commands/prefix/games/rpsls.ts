import type { Command } from '../../../core/types';

const command: Command = {
  name: "rpsls",
  aliases: [],
  description: "Play rock paper scissors lizard spock against the bot.",
  usage: "",
  category: "games",
  logic: "rpsls",
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
