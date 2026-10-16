import type { Command } from '../../../core/types';

const command: Command = {
  name: "love",
  aliases: [],
  description: "Calculates love percentage between two users.",
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
  recordingFile: "prefix/love.json",
};

export = command;
