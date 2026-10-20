import type { Command } from '../../../core/types';

const command: Command = {
  name: "subscription",
  aliases: [],
  description: "Show the premium subscription of a user or of this server.",
  usage: "[user|server] [ID|@member]",
  category: "premium",
  logic: "premiumSubscription",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
