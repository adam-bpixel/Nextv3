import type { Command } from '../../../core/types';

const command: Command = {
  name: "usebot",
  aliases: [],
  description: "Dev-only: choose which managed bot should answer commands in this server.",
  usage: "<bot id or name|main>",
  category: "owner",
  logic: "ownerUseBot",
  ai: null,
  permissions: [],
  ownerOnly: true,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
