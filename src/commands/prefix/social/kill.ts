import type { Command } from '../../../core/types';

const command: Command = {
  name: "kill",
  aliases: [],
  description: "Kill someone.",
  usage: "[user mention]",
  category: "social",
  logic: "kill",
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
