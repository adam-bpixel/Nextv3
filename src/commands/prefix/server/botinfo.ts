import type { Command } from '../../../core/types';

const command: Command = {
  name: "botinfo",
  aliases: [],
  description: "Show information about the bot.",
  usage: "",
  category: "Information",
  logic: "botinfo",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/botinfo.json",
};

export = command;
