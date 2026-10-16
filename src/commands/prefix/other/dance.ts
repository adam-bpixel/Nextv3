import type { Command } from '../../../core/types';

const command: Command = {
  name: "dance",
  aliases: [],
  description: "Dance.",
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
  recordingFile: "prefix/dance.json",
};

export = command;
