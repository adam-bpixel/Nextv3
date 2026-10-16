import type { Command } from '../../../core/types';

const command: Command = {
  name: "cuddle",
  aliases: [],
  description: "Cuddle someone.",
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
  recordingFile: "prefix/cuddle.json",
};

export = command;
