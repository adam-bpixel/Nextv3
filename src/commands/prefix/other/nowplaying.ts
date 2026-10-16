import type { Command } from '../../../core/types';

const command: Command = {
  name: "nowplaying",
  aliases: [],
  description: "Show the currently playing song.",
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
  recordingFile: "prefix/nowplaying.json",
};

export = command;
