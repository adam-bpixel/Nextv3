import type { Command } from '../../../core/types';

const command: Command = {
  name: "fullcheck",
  aliases: ["fc"],
  description: "Check a user's profile, roles, and permissions.",
  usage: "<user mention, ID, or username>",
  category: "Checker",
  logic: "fullcheck",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "prefix/fullcheck.json",
};

export = command;
