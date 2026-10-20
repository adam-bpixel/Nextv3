import type { Command } from '../../../core/types';

const command: Command = {
  name: "voicecount",
  aliases: [],
  description: "Manage voice count system for the server.",
  usage: "<on|off|channel> [channel mention or ID]",
  category: "admin",
  logic: "voicecount",
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
