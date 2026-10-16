import type { Command } from '../../../core/types';

const command: Command = {
  name: "voicecount",
  aliases: [],
  description: "Manage voice count system for the server.",
  usage: "<on|off|channel> [channel mention or ID]",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/voicecount.json",
};

export = command;
