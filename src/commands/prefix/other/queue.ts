import type { Command } from '../../../core/types';

const command: Command = {
  name: "queue",
  aliases: [],
  description: "Show the current music queue.",
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
  recordingFile: "prefix/queue.json",
};

export = command;
