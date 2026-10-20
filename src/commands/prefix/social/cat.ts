import type { Command } from '../../../core/types';

const command: Command = {
  name: "cat",
  aliases: [],
  description: "Show a random cat picture.",
  usage: "",
  category: "social",
  logic: "cat",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
