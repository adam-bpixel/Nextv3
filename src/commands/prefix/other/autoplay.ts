import type { Command } from '../../../core/types';

const command: Command = {
  name: "autoplay",
  aliases: [],
  description: "Toggle autoplay or change its recommendation mode.",
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
  recordingFile: "prefix/autoplay.json",
};

export = command;
