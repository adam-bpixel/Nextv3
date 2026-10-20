import type { Command } from '../../../core/types';

const command: Command = {
  name: "antibots",
  aliases: [],
  description: "Enable or disable the anti-bot system.",
  usage: "<on|off>",
  category: "security",
  logic: "antibotsToggle",
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 3,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
