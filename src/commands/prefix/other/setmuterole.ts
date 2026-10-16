import type { Command } from '../../../core/types';

const command: Command = {
  name: "setmuterole",
  aliases: [],
  description: "Set which role can use mute-related moderation commands.",
  usage: "<role>",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/setmuterole.json",
};

export = command;
