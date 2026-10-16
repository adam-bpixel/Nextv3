import type { Command } from '../../../core/types';

const command: Command = {
  name: "emojiquiz",
  aliases: [],
  description: "Match the emoji clue to the right phrase.",
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
  recordingFile: "prefix/emojiquiz.json",
};

export = command;
