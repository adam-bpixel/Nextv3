import type { Command } from '../../../core/types';

const command: Command = {
  name: "vb",
  aliases: [],
  description: "Verifies a user as male.",
  usage: "",
  category: "Verification",
  logic: "vb",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 10,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/vb.json",
};

export = command;
