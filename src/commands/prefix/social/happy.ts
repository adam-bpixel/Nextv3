import type { Command } from '../../../core/types';

const command: Command = {
  name: "happy",
  aliases: [],
  description: "Happy.",
  usage: "",
  category: "social",
  logic: "happy",
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
