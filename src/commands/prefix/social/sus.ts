import type { Command } from '../../../core/types';

const command: Command = {
  name: "sus",
  aliases: [],
  description: "Manages sus users in the server.",
  usage: "<add|remove|list> [user]",
  category: "social",
  logic: "sus",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
