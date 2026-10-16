import type { Command } from '../../../core/types';

const command: Command = {
  name: "quickmath",
  aliases: [],
  description: "Solve a quick math problem.",
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
  recordingFile: "prefix/quickmath.json",
};

export = command;
