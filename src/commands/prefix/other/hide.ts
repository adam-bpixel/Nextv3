import type { Command } from '../../../core/types';

const command: Command = {
  name: "hide",
  aliases: [],
  description: "Hide Channel From everyone",
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
  recordingFile: "prefix/hide.json",
};

export = command;
