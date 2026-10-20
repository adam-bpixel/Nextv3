import type { Command } from '../../../core/types';

const command: Command = {
  name: "removebot",
  aliases: [],
  description: "Dev-only: remove a managed extra bot and delete its saved token.",
  usage: "<bot id or name>",
  category: "owner",
  logic: "ownerRemoveBot",
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
