import type { Command } from '../../../core/types';

const command: Command = {
  name: "autoreply-remove",
  aliases: [],
  description: "Remove a autoreply already stored in data",
  usage: "<trigger>",
  category: "reply",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/autoreply_remove.json",
};

export = command;
