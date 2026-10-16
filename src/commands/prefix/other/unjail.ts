import type { Command } from '../../../core/types';

const command: Command = {
  name: "unjail",
  aliases: [],
  description: "Unjails a user and restores their roles.",
  usage: "",
  category: "jail",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/unjail.json",
};

export = command;
