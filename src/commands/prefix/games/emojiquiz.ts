import type { Command } from '../../../core/types';

const command: Command = {
  name: "emojiquiz",
  aliases: [],
  description: "Match the emoji clue to the right phrase.",
  usage: "",
  category: "games",
  logic: "emojiquiz",
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
