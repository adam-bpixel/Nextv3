import type { Command } from '../../../core/types';

const command: Command = {
  name: "oddoneout",
  aliases: [],
  description: "Spot the item that does not belong.",
  usage: "",
  category: "games",
  logic: "oddoneout",
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
