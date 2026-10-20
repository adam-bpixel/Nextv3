import type { Command } from '../../../core/types';

const command: Command = {
  name: "luckybutton",
  aliases: [],
  description: "Find the one lucky button.",
  usage: "",
  category: "games",
  logic: "luckybutton",
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
