import type { Command } from '../../../core/types';

const command: Command = {
  name: "vunmute",
  aliases: [],
  description: "Remove a server mute from a member.",
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
  recordingFile: "prefix/vunmute.json",
};

export = command;
