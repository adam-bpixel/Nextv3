import type { Command } from '../../../core/types';

const command: Command = {
  name: "targettap",
  aliases: [],
  description: "Tap the exact target emoji.",
  usage: "",
  category: "games",
  logic: "targettap",
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
