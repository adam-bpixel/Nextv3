import type { Command } from '../../../core/types';

const command: Command = {
  name: "getinvite",
  aliases: [],
  description: "Get the invite link for any bot with avatar and button inside container",
  usage: "<bot mention or ID>",
  category: "Information",
  logic: "getinvite",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: null,
};

export = command;
