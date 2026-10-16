import type { Command } from '../../core/types';

const command: Command = {
  path: "cmdtimeout list",
  menuType: "slash",
  description: "List every configured command usage limit.",
  options: [],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/cmdtimeout__list.json",
};

export = command;
