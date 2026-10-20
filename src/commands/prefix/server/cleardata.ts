import type { Command } from '../../../core/types';

const command: Command = {
  name: "cleardata",
  aliases: [],
  description: "Clear all server data (owner only).",
  usage: "confirm",
  category: "admin",
  logic: "ownerClearData",
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
