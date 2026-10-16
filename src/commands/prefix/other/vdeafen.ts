import type { Command } from '../../../core/types';

const command: Command = {
  name: "vdeafen",
  aliases: [],
  description: "Voice Deafen A Member",
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
  recordingFile: "prefix/vdeafen.json",
};

export = command;
