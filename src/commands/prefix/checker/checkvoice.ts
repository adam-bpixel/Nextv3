import type { Command } from '../../../core/types';

const command: Command = {
  name: "checkvoice",
  aliases: ["cv"],
  description: "Find a user's voice channel.",
  usage: "<user mention, ID, or username>",
  category: "Checker",
  logic: "checkvoice",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "prefix/checkvoice.json",
};

export = command;
