import type { Command } from '../../../core/types';

const command: Command = {
  name: "vundeafen",
  aliases: [],
  description: "Voice Undeafen",
  usage: "<member>",
  category: "moderation",
  logic: "vundeafen",
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
