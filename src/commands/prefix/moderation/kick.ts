import type { Command } from '../../../core/types';

const command: Command = {
  name: "kick",
  aliases: [],
  description: "Kicks a user from the server.",
  usage: "<user mention or ID> [reason]",
  category: "moderation",
  logic: "kick",
  ai: null,
  permissions: ["kick_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/kick.json",
};

export = command;
