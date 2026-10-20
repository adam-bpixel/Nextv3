import type { Command } from '../../../core/types';

const command: Command = {
  name: "treasuremap",
  aliases: [],
  description: "Find the marked treasure spot.",
  usage: "",
  category: "games",
  logic: "treasuremap",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
