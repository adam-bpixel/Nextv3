import type { Command } from '../../../core/types';

const command: Command = {
  name: "24",
  aliases: [],
  description: "Combine four numbers with + - * / to make 24.",
  usage: "",
  category: "games",
  logic: "24",
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
