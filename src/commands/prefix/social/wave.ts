import type { Command } from '../../../core/types';

const command: Command = {
  name: "wave",
  aliases: [],
  description: "Wave at someone.",
  usage: "[user mention or ID]",
  category: "social",
  logic: "wave",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
