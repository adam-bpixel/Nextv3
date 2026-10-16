import type { Command } from '../../../core/types';

const command: Command = {
  name: "coinflip",
  aliases: [],
  description: "Call heads or tails and see if luck is on your side.",
  usage: "",
  category: "fun",
  logic: "coinflip",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/coinflip.json",
};

export = command;
