import type { Command } from '../../../core/types';

const command: Command = {
  name: "sequence",
  aliases: [],
  description: "Find the next number in the sequence.",
  usage: "",
  category: "games",
  logic: "sequence",
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
