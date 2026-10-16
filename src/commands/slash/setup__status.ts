import type { Command } from '../../core/types';

const command: Command = {
  path: "setup status",
  menuType: "slash",
  description: "Shows which setup sections are configured for this server.",
  options: [],
  logic: "setupStatus",
  ai: null,
  permissions: ["manage_guild"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "slash/setup__status.json",
};

export = command;
