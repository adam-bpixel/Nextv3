import type { Command } from '../../../core/types';

const command: Command = {
  name: "cat",
  aliases: [],
  description: "Show a random cat picture.",
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
  recordingFile: "prefix/cat.json",
};

export = command;
