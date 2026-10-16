import type { Command } from '../../../core/types';

const command: Command = {
  name: "embed",
  aliases: [],
  description: "Make Embed With Bot Using discohook.org",
  usage: ", please provide JSON data from a tool like discohook.org.",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/embed.json",
};

export = command;
