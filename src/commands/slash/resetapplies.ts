import type { Command } from '../../core/types';

const command: Command = {
  path: "resetapplies",
  menuType: "slash",
  description: "Cancel every pending application in this server.",
  options: [],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/resetapplies.json",
};

export = command;
