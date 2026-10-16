import type { Command } from '../../../core/types';

const command: Command = {
  name: "howgay",
  aliases: [],
  description: "Calculates how gay a user is.",
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
  recordingFile: "prefix/howgay.json",
};

export = command;
