import type { Command } from '../../../core/types';

const command: Command = {
  name: "move",
  aliases: [],
  description: "Move a member to a voice channel, or to your current voice channel.",
  usage: "<member> [voice channel]",
  category: "moderation",
  logic: "move",
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
