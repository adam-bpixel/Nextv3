import type { Command } from '../../../core/types';

const command: Command = {
  name: "setroleslogs",
  aliases: [],
  description: "Set which channel receives logs for the role command.",
  usage: "<channel>",
  category: "admin",
  logic: "setroleslogs",
  ai: null,
  permissions: ["manage_roles"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
