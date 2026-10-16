import type { Command } from '../../../core/types';

const command: Command = {
  name: "backward",
  aliases: [],
  description: "Jump backward in the current song.",
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
  recordingFile: "prefix/backward.json",
};

export = command;
