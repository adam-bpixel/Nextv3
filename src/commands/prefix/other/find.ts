import type { Command } from '../../../core/types';

const command: Command = {
  name: "find",
  aliases: [],
  description: "Voice Find A Member in Server",
  usage: "<member>",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/find.json",
};

export = command;
