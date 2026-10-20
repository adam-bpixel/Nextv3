import type { Command } from '../../../core/types';

const command: Command = {
  name: "wordscramble",
  aliases: [],
  description: "Unscramble a longer word.",
  usage: "",
  category: "games",
  logic: "wordscramble",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
