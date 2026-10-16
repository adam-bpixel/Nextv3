import type { Command } from '../../../core/types';

const command: Command = {
  name: "fullcheck",
  aliases: ["fc"],
  description: "Full profile check across every mutual server: status, roles and dangerous permissions",
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
