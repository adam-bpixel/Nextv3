import type { Command } from '../../core/types';

const command: Command = {
  path: "tempchannel list",
  menuType: "slash",
  description: "List configured temporary voice channel triggers and active rooms.",
  options: [],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/tempchannel__list.json",
};

export = command;
