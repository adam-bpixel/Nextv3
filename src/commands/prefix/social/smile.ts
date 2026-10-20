import type { Command } from '../../../core/types';

const command: Command = {
  name: "smile",
  aliases: [],
  description: "Smile at someone.",
  usage: "[user mention]",
  category: "social",
  logic: "smile",
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
