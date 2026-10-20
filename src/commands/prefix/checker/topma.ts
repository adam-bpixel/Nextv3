import type { Command } from '../../../core/types';

const command: Command = {
  name: "topma",
  aliases: [],
  description: "Rank servers by voice activity.",
  usage: "",
  category: "Checker",
  logic: "topma",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "prefix/topma.json",
};

export = command;
