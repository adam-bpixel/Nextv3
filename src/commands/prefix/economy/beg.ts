import type { Command } from '../../../core/types';

const command: Command = {
  name: "beg",
  aliases: [],
  description: "Beg for some spare currency.",
  usage: "",
  category: "economy",
  logic: "beg",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 600,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
