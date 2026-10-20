import type { Command } from '../../../core/types';

const command: Command = {
  name: "membercount",
  aliases: [],
  description: "Show server member count (humans, bots, and users joined today)",
  usage: "",
  category: "Information",
  logic: "membercount",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/membercount.json",
};

export = command;
