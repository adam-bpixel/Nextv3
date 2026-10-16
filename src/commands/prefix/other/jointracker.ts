import type { Command } from '../../../core/types';

const command: Command = {
  name: "jointracker",
  aliases: [],
  description: "Manages the join tracker system.",
  usage: "<on|off|channel> [channel]",
  category: "security",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/jointracker.json",
};

export = command;
