import type { Command } from '../../../core/types';

const command: Command = {
  name: "addbot",
  aliases: [],
  description: "Dev-only: opens a private form to add a bot token to the extra-bot fleet.",
  usage: "",
  category: "owner",
  logic: "ownerAddBot",
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
