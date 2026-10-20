import type { Command } from '../../../core/types';

const command: Command = {
  name: "avatar",
  aliases: [],
  description: "Show a user's avatar without pinging",
  usage: "",
  category: "Information",
  logic: "avatar",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/avatar.json",
};

export = command;
