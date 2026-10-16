import type { Command } from '../../core/types';

const command: Command = {
  path: "sendapplypanel",
  menuType: "slash",
  description: "Send the apply panel with category buttons into this channel.",
  options: [],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/sendapplypanel.json",
};

export = command;
