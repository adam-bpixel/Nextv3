import type { Command } from '../../../core/types';

const command: Command = {
  name: "anagram",
  aliases: [],
  description: "Unscramble a quick anagram.",
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
  recordingFile: "prefix/anagram.json",
};

export = command;
