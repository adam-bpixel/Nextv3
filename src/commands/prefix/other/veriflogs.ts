import type { Command } from '../../../core/types';

const command: Command = {
  name: "veriflogs",
  aliases: [],
  description: "Displays verification history for a user.",
  usage: "",
  category: "Verification",
  logic: "veriflogs",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/veriflogs.json",
};

export = command;
