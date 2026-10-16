import type { Command } from '../../../core/types';

const command: Command = {
  name: "verifpanel",
  aliases: [],
  description: "Sends a verification panel with Male/Female buttons.",
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
  recordingFile: "prefix/verifpanel.json",
};

export = command;
