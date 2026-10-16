import type { Command } from '../../../core/types';

const command: Command = {
  name: "afk",
  aliases: [],
  description: "Set AFK status.",
  usage: "",
  category: "fun",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/afk.json",
};

export = command;
