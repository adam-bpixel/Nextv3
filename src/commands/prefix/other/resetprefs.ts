import type { Command } from '../../../core/types';

const command: Command = {
  name: "resetprefs",
  aliases: [],
  description: "Reset your saved autoplay learning data.",
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
  recordingFile: "prefix/resetprefs.json",
};

export = command;
