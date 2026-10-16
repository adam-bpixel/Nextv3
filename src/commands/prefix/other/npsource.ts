import type { Command } from '../../../core/types';

const command: Command = {
  name: "npsource",
  aliases: [],
  description: "Show the safe source used for the currently playing track.",
  usage: "",
  category: "music",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/npsource.json",
};

export = command;
