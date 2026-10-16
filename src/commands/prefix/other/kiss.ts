import type { Command } from '../../../core/types';

const command: Command = {
  name: "kiss",
  aliases: [],
  description: "Kiss someone.",
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
  recordingFile: "prefix/kiss.json",
};

export = command;
