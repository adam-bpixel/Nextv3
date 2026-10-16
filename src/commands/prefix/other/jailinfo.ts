import type { Command } from '../../../core/types';

const command: Command = {
  name: "jailinfo",
  aliases: [],
  description: "Displays jail information for a specified user.",
  usage: "",
  category: "jail",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/jailinfo.json",
};

export = command;
