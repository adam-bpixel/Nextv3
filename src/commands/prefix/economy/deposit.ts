import type { Command } from '../../../core/types';

const command: Command = {
  name: "deposit",
  aliases: ["dep"],
  description: "Move currency from your wallet into your bank.",
  usage: "<amount|all>",
  category: "economy",
  logic: "deposit",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
