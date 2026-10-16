import type { Command } from '../../../core/types';

const command: Command = {
  name: "antibots",
  aliases: [],
  description: "Enable or disable the anti-bot system.",
  usage: "<on|off>",
  category: "security",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/antibots.json",
};

export = command;
