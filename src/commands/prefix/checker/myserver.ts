import type { Command } from '../../../core/types';

const command: Command = {
  name: "myserver",
  aliases: ["ms"],
  description: "Show this server's voice leaderboard.",
  usage: "",
  category: "Checker",
  logic: "myserver",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/myserver.json",
};

export = command;
