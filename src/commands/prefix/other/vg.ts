import type { Command } from '../../../core/types';

const command: Command = {
  name: "vg",
  aliases: [],
  description: "Verifies a user as female.",
  usage: "",
  category: "Verification",
  logic: "vg",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 10,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/vg.json",
};

export = command;
