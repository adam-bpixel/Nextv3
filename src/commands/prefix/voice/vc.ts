import type { Command } from '../../../core/types';

const command: Command = {
  name: "vc",
  aliases: ["stats"],
  description: "Show server stats: members, voice members, and boosts",
  usage: "",
  category: "Information",
  logic: "serverStats",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 5,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
