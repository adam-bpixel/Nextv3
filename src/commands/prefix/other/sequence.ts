import type { Command } from '../../../core/types';

const command: Command = {
  name: "sequence",
  aliases: [],
  description: "Find the next number in the sequence.",
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
  recordingFile: "prefix/sequence.json",
};

export = command;
