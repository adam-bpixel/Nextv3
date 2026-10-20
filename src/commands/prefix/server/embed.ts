import type { Command } from '../../../core/types';

const command: Command = {
  name: "embed",
  aliases: [],
  description: "Create an embed from EmbedBuilder code.",
  usage: "<EmbedBuilder code>",
  category: "admin",
  logic: "embed",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/embed.json",
};

export = command;
