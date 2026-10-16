import type { Command } from '../../../core/types';

const command: Command = {
  name: "filter",
  aliases: [],
  description: "Apply audio filters and EQ presets.",
  usage: "",
  category: "music",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: true,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/filter.json",
};

export = command;
