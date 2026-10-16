import type { Command } from '../../../core/types';

const command: Command = {
  name: "sus",
  aliases: [],
  description: "Manages sus users in the server.",
  usage: "",
  category: "Verification",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/sus.json",
};

export = command;
