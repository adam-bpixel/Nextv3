import type { Command } from '../../../core/types';

const command: Command = {
  name: "forward",
  aliases: [],
  description: "Jump forward in the current song.",
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
  recordingFile: "prefix/forward.json",
};

export = command;
