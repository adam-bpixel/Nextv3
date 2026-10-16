import type { Command } from '../../../core/types';

const command: Command = {
  name: "vundeafen",
  aliases: [],
  description: "Voice Undeafen",
  usage: "<member>",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/vundeafen.json",
};

export = command;
