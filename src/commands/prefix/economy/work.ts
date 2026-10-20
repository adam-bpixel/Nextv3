import type { Command } from '../../../core/types';

const command: Command = {
  name: "work",
  aliases: [],
  description: "Work to earn some currency.",
  usage: "",
  category: "economy",
  logic: "work",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 3600,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
