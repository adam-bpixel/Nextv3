import type { Command } from '../../../core/types';

const command: Command = {
  name: "fasttype",
  aliases: [],
  description: "Type the shown phrase exactly.",
  usage: "",
  category: "games",
  logic: "fasttype",
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
