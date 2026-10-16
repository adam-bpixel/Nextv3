import type { Command } from '../../../core/types';

const command: Command = {
  name: "tag",
  aliases: [],
  description: "Show command info & aliases",
  usage: "",
  category: "Information",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/tag.json",
};

export = command;
