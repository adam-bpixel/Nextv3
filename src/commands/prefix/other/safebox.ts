import type { Command } from '../../../core/types';

const command: Command = {
  name: "safebox",
  aliases: [],
  description: "Pick the safe box with the loot.",
  usage: "",
  category: "fun",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/safebox.json",
};

export = command;
