import type { Command } from '../../../core/types';

const command: Command = {
  name: "premium",
  aliases: [],
  description: "Give or remove premium for a user or a server (bot owner only).",
  usage: "<add|remove> <user|server> <id> [duration]",
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
