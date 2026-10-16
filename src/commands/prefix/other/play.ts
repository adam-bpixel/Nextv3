import type { Command } from '../../../core/types';

const command: Command = {
  name: "play",
  aliases: [],
  description: "Play a song or playlist in your voice channel.",
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
  recordingFile: "prefix/play.json",
};

export = command;
