import type { Command } from '../../../core/types';

const command: Command = {
  name: "topverif",
  aliases: [],
  description: "Shows the top 10 verifiers in the server.",
  usage: "",
  category: "Verification",
  logic: "topverif",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/topverif.json",
};

export = command;
