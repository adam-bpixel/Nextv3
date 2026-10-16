import type { Command } from '../../../core/types';

const command: Command = {
  name: "gendre",
  aliases: [],
  description: "Show or set your gender.",
  usage: "set <gender>",
  category: "fun",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/gendre.json",
};

export = command;
