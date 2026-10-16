import type { Command } from '../../../core/types';

const command: Command = {
  name: "getinvite",
  aliases: [],
  description: "Get the invite link for any bot with avatar and button inside container",
  usage: "",
  category: "Information",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/getinvite.json",
};

export = command;
