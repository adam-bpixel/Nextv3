import type { Command } from '../../../core/types';

const command: Command = {
  name: "cups",
  aliases: [],
  description: "Pick the cup hiding the prize.",
  usage: "",
  category: "games",
  logic: "cups",
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
