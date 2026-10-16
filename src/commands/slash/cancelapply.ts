import type { Command } from '../../core/types';

const command: Command = {
  path: "cancelapply",
  menuType: "slash",
  description: "Cancel your currently pending application.",
  options: [],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/cancelapply.json",
};

export = command;
