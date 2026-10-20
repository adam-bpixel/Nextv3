import type { Command } from '../../../core/types';

const command: Command = {
  name: "cmdtimeout",
  aliases: [],
  description: "View or change per-server command cooldowns.",
  usage: "<check|list|set|remove|reset> [command] [duration]",
  category: "admin",
  logic: "cmdTimeout",
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
