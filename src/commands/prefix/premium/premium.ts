import type { Command } from '../../../core/types';

const command: Command = {
  name: "premium",
  aliases: [],
  description: "Give, remove or list premium for users and servers (bot owner only).",
  usage: "<add|remove|list> <user|server> [id] [duration]",
  category: "owner",
  logic: "premiumGrant",
  ai: null,
  permissions: [],
  ownerOnly: true,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: null,
};

export = command;
