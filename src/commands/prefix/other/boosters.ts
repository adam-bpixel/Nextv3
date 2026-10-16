import type { Command } from '../../../core/types';

const command: Command = {
  name: "boosters",
  aliases: [],
  description: "A list of current server boosters.",
  usage: "",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/boosters.json",
};

export = command;
