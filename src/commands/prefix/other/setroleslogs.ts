import type { Command } from '../../../core/types';

const command: Command = {
  name: "setroleslogs",
  aliases: [],
  description: "Set which channel receives logs for the role command.",
  usage: "<channel>",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/setroleslogs.json",
};

export = command;
