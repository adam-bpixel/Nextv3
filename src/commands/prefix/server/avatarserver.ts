import type { Command } from '../../../core/types';

const command: Command = {
  name: "avatarserver",
  aliases: [],
  description: "Show the server's avatar (icon) in a nice UI",
  usage: "",
  category: "Information",
  logic: "avatarserver",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
