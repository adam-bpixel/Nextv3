import type { Command } from '../../../core/types';

const command: Command = {
  name: "targettap",
  aliases: [],
  description: "Tap the exact target emoji.",
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
  recordingFile: "prefix/targettap.json",
};

export = command;
