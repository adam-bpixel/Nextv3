import type { Command } from '../../../core/types';

const command: Command = {
  name: "vunmute",
  aliases: [],
  description: "Remove a server mute from a member.",
  usage: "<member>",
  category: "moderation",
  logic: "vunmute",
  ai: null,
  permissions: ["mute_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
