import type { Command } from '../../../core/types';

const command: Command = {
  name: "topmembers",
  aliases: ["topma"],
  description: "Leaderboard of servers ranked by current voice activity",
  usage: "",
  category: "Checker",
  logic: "topmembers",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "prefix/topmembers.json",
};

export = command;
