import type { Command } from '../../../core/types';

const command: Command = {
  name: "cry",
  aliases: [],
  description: "Cry alone or to someone.",
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
  recordingFile: "prefix/cry.json",
};

export = command;
