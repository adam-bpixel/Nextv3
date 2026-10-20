import type { Command } from '../../../core/types';

const command: Command = {
  name: "anagram",
  aliases: [],
  description: "Unscramble a quick anagram.",
  usage: "",
  category: "games",
  logic: "anagram",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
