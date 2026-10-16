import type { Command } from '../../../core/types';

const command: Command = {
  name: "dicebattle",
  aliases: [],
  description: "Roll against the bot and see who gets the higher number.",
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
  recordingFile: "prefix/dicebattle.json",
};

export = command;
