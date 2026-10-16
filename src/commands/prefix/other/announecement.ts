import type { Command } from '../../../core/types';

const command: Command = {
  name: "announecement",
  aliases: [],
  description: "Dev-only: DM an announcement to every unique guild owner the bot can reach.",
  usage: "",
  category: "devs",
  logic: null,
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "permission",
  recordingFile: "prefix/announecement.json",
};

export = command;
