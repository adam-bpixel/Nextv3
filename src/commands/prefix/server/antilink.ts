import type { Command } from '../../../core/types';

const command: Command = {
  name: "antilink",
  aliases: [],
  description: "Enable or disable the anti-invite link system.",
  usage: "<on|off>",
  category: "security",
  logic: "antilinkToggle",
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
