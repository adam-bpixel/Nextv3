import type { Command } from '../../../core/types';

const command: Command = {
  name: "cups",
  aliases: [],
  description: "Pick the cup hiding the prize.",
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
  recordingFile: "prefix/cups.json",
};

export = command;
