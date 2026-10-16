import type { Command } from '../../../core/types';

const command: Command = {
  name: "slotrush",
  aliases: [],
  description: "Spin a tiny slot machine.",
  usage: "",
  category: "fun",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/slotrush.json",
};

export = command;
