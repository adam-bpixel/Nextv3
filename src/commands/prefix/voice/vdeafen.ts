import type { Command } from '../../../core/types';

const command: Command = {
  name: "vdeafen",
  aliases: [],
  description: "Voice Deafen A Member",
  usage: "<member>",
  category: "moderation",
  logic: "vdeafen",
  ai: null,
  permissions: ["deafen_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
