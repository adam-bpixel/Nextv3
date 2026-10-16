import type { Command } from '../../../core/types';

const command: Command = {
  name: "rpsls",
  aliases: [],
  description: "Play rock paper scissors lizard spock against the bot.",
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
  recordingFile: "prefix/rpsls.json",
};

export = command;
