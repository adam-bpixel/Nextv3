import type { Command } from '../../../core/types';

const command: Command = {
  name: "moveall",
  aliases: [],
  description: "Move all movable members from one voice channel to another.",
  usage: "<from voice channel> <to voice channel>",
  category: "moderation",
  logic: "moveall",
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
