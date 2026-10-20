import type { Command } from '../../../core/types';

const command: Command = {
  name: "rob",
  aliases: [],
  description: "Attempt to rob another member's wallet.",
  usage: "<user mention or ID>",
  category: "economy",
  logic: "rob",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 3600,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
