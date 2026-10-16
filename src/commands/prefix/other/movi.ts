import type { Command } from '../../../core/types';

const command: Command = {
  name: "movi",
  aliases: [],
  description: "Move a queued song to a new position.",
  usage: "",
  category: "music",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: true,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/movi.json",
};

export = command;
