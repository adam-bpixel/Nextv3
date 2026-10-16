import type { Command } from '../../../core/types';

const command: Command = {
  name: "preferences",
  aliases: [],
  description: "Show your saved autoplay preferences and listening stats.",
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
  recordingFile: "prefix/preferences.json",
};

export = command;
