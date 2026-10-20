import type { Command } from '../../../core/types';

const command: Command = {
  name: "balance",
  aliases: ["bal", "cash"],
  description: "Check your or another member's wallet balance.",
  usage: "[user mention or ID]",
  category: "economy",
  logic: "balance",
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
