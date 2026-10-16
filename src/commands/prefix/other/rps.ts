import type { Command } from '../../../core/types';

const command: Command = {
  name: "rps",
  aliases: [],
  description: "Play rock paper scissors against the bot.",
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
  recordingFile: "prefix/rps.json",
};

export = command;
