import type { Command } from '../../../core/types';

const command: Command = {
  name: "jailinfo",
  aliases: [],
  description: "Displays jail information for a specified user.",
  usage: "<user mention or ID>",
  category: "Jail",
  logic: "jailinfo",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
