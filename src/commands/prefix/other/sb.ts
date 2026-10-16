import type { Command } from '../../../core/types';

const command: Command = {
  name: "sb",
  aliases: [],
  description: "Enable or disable SoundBoard in the channel.",
  usage: "<enable|disable> [channel]",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/sb.json",
};

export = command;
