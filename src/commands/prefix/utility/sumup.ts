import type { Command } from '../../../core/types';

const command: Command = {
  name: "sumup",
  aliases: [],
  description: "Add three numbers as fast as you can.",
  usage: "",
  category: "games",
  logic: "sumup",
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
