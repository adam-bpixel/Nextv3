import type { Command } from '../../../core/types';

const command: Command = {
  name: "jail",
  aliases: [],
  description: "Jails a user in the server.",
  usage: "<user mention or ID> [reason]",
  category: "Jail",
  logic: "jail",
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
