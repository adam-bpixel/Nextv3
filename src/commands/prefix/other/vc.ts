import type { Command } from '../../../core/types';

const command: Command = {
  name: "vc",
  aliases: [],
  description: "Show server stats: members, voice members, and boosts",
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
  recordingFile: "prefix/vc.json",
};

export = command;
