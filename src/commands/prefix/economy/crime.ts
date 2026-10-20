import type { Command } from '../../../core/types';

const command: Command = {
  name: "crime",
  aliases: [],
  description: "Commit a crime for a risky payout.",
  usage: "",
  category: "economy",
  logic: "crime",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 1800,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
