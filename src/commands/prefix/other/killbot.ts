import type { Command } from '../../../core/types';

const command: Command = {
  name: "killbot",
  aliases: [],
  description: "Dev-only: stop a running extra bot without deleting its saved token.",
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
  recordingFile: "prefix/killbot.json",
};

export = command;
