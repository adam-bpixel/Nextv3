import type { Command } from '../../../core/types';

const command: Command = {
  name: "smile",
  aliases: [],
  description: "Smile at someone.",
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
  recordingFile: "prefix/smile.json",
};

export = command;
