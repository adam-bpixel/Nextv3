import type { Command } from '../../../core/types';

const command: Command = {
  name: "pay",
  aliases: ["give"],
  description: "Pay another member from your wallet.",
  usage: "<user mention or ID> <amount|all>",
  category: "economy",
  logic: "pay",
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
