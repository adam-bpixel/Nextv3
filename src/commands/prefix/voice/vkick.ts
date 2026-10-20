import type { Command } from '../../../core/types';

const command: Command = {
  name: "vkick",
  aliases: [],
  description: "Disconnects a user from a voice channel.",
  usage: "<user mention or ID> [reason]",
  category: "moderation",
  logic: "vkick",
  ai: null,
  permissions: ["move_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
