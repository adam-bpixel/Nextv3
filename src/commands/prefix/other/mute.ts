import type { Command } from '../../../core/types';

const command: Command = {
  name: "mute",
  aliases: [],
  description: "Adds the configured muted role to a user for a required duration.",
  usage: "<user mention or ID> <duration> <reason> (e.g., 1h spam, 30m being loud)",
  category: "moderation",
  logic: "timeout",
  ai: null,
  permissions: ["moderate_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/mute.json",
};

export = command;
