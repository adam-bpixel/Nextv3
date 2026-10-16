import type { Command } from '../../../core/types';

const command: Command = {
  name: "seek",
  aliases: [],
  description: "Jump to a time inside the current song.",
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
  recordingFile: "prefix/seek.json",
};

export = command;
