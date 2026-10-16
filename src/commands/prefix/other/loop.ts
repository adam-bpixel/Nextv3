import type { Command } from '../../../core/types';

const command: Command = {
  name: "loop",
  aliases: [],
  description: "Change the repeat mode for the current queue.",
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
  recordingFile: "prefix/loop.json",
};

export = command;
