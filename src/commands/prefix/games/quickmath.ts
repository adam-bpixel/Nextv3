import type { Command } from '../../../core/types';

const command: Command = {
  name: "quickmath",
  aliases: [],
  description: "Solve a quick math problem.",
  usage: "",
  category: "games",
  logic: "quickmath",
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
