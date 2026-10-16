import type { Command } from '../../../core/types';

const command: Command = {
  name: "listgames",
  aliases: [],
  description: "List all configured game aliases.",
  usage: "",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/listgames.json",
};

export = command;
