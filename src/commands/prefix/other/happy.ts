import type { Command } from '../../../core/types';

const command: Command = {
  name: "happy",
  aliases: [],
  description: "Happy.",
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
  recordingFile: "prefix/happy.json",
};

export = command;
