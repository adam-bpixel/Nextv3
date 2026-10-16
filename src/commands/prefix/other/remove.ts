import type { Command } from '../../../core/types';

const command: Command = {
  name: "remove",
  aliases: [],
  description: "Remove a queued song by its position.",
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
  recordingFile: "prefix/remove.json",
};

export = command;
