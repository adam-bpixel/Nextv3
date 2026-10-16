import type { Command } from '../../../core/types';

const command: Command = {
  name: "treasuremap",
  aliases: [],
  description: "Find the marked treasure spot.",
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
  recordingFile: "prefix/treasuremap.json",
};

export = command;
