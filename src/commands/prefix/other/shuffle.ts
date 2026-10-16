import type { Command } from '../../../core/types';

const command: Command = {
  name: "shuffle",
  aliases: [],
  description: "Shuffle the queued songs.",
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
  recordingFile: "prefix/shuffle.json",
};

export = command;
