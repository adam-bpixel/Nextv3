import type { Command } from '../../../core/types';

const command: Command = {
  name: "unmute",
  aliases: [],
  description: "Removes the configured muted role or an active timeout from a user.",
  usage: "<user mention or ID> [reason]",
  category: "moderation",
  logic: "untimeout",
  ai: null,
  permissions: ["moderate_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/unmute.json",
};

export = command;
