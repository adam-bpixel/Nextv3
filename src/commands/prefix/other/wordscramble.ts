import type { Command } from '../../../core/types';

const command: Command = {
  name: "wordscramble",
  aliases: [],
  description: "Unscramble a longer word.",
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
  recordingFile: "prefix/wordscramble.json",
};

export = command;
