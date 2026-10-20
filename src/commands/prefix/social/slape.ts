import type { Command } from '../../../core/types';

const command: Command = {
  name: "slape",
  aliases: [],
  description: "Slape a user.",
  usage: "[user mention]",
  category: "social",
  logic: "slape",
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
