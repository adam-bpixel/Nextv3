import type { Command } from '../../../core/types';

const command: Command = {
  name: "stop",
  aliases: [],
  description: "Stop playback and leave the voice channel.",
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
  recordingFile: "prefix/stop.json",
};

export = command;
