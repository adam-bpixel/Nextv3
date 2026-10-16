import type { Command } from '../../../core/types';

const command: Command = {
  name: "show",
  aliases: [],
  description: "Show Channel To everyone",
  usage: "",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/show.json",
};

export = command;
