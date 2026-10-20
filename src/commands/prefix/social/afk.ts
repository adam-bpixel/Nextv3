import type { Command } from '../../../core/types';

const command: Command = {
  name: "afk",
  aliases: [],
  description: "Set AFK status.",
  usage: "[reason]",
  category: "social",
  logic: "afk",
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
