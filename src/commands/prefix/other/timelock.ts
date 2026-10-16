import type { Command } from '../../../core/types';

const command: Command = {
  name: "timelock",
  aliases: [],
  description: "Time Lock The Channel",
  usage: "<duration> (e.g., 1h, 30m, 7d)",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/timelock.json",
};

export = command;
