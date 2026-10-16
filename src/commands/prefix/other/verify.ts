import type { Command } from '../../../core/types';

const command: Command = {
  name: "verify",
  aliases: [],
  description: "Sends a verification message with gender selection buttons.",
  usage: "",
  category: "Verification",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/verify.json",
};

export = command;
