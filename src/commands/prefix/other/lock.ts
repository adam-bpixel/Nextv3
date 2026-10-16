import type { Command } from '../../../core/types';

const command: Command = {
  name: "lock",
  aliases: [],
  description: "Disables @everyone from sending messages in specific channel.",
  usage: "",
  category: "admin",
  logic: "lock",
  ai: null,
  permissions: ["manage_channels"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/lock.json",
};

export = command;
