import type { Command } from '../../../core/types';

const command: Command = {
  name: "jaillogs",
  aliases: [],
  description: "Displays jail history for a user.",
  usage: "<user mention or ID>",
  category: "Jail",
  logic: "jaillogs",
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
