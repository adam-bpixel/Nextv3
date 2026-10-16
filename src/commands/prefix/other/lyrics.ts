import type { Command } from '../../../core/types';

const command: Command = {
  name: "lyrics",
  aliases: [],
  description: "Fetch lyrics for the current song or a search query.",
  usage: "",
  category: "music",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/lyrics.json",
};

export = command;
