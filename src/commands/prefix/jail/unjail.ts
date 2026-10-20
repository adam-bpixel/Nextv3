import type { Command } from '../../../core/types';

const command: Command = {
  name: "unjail",
  aliases: [],
  description: "Unjails a user and restores their roles.",
  usage: "<user mention or ID> [reason]",
  category: "Jail",
  logic: "unjail",
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
