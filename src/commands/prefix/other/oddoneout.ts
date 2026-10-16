import type { Command } from '../../../core/types';

const command: Command = {
  name: "oddoneout",
  aliases: [],
  description: "Spot the item that does not belong.",
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
  recordingFile: "prefix/oddoneout.json",
};

export = command;
