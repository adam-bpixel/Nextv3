import type { Command } from '../../core/types';

const command: Command = {
  path: "tempchannel cleanup",
  menuType: "slash",
  description: "Delete stale empty temporary rooms and orphaned records.",
  options: [],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/tempchannel__cleanup.json",
};

export = command;
