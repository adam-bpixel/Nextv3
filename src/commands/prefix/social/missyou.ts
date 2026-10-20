import type { Command } from '../../../core/types';

const command: Command = {
  name: "missyou",
  aliases: [],
  description: "Miss someone.",
  usage: "[user mention]",
  category: "social",
  logic: "missyou",
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
