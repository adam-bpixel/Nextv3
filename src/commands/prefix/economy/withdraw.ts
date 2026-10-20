import type { Command } from '../../../core/types';

const command: Command = {
  name: "withdraw",
  aliases: ["wd"],
  description: "Move currency from your bank into your wallet.",
  usage: "<amount|all>",
  category: "economy",
  logic: "withdraw",
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
