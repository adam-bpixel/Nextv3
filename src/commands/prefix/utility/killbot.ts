import type { Command } from '../../../core/types';

const command: Command = {
  name: "killbot",
  aliases: [],
  description: "Dev-only: stop a running extra bot without deleting its saved token.",
  usage: "<bot id or name>",
  category: "owner",
  logic: "ownerKillBot",
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
