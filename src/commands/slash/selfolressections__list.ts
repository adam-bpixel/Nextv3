import type { Command } from '../../core/types';

const command: Command = {
  path: "selfolressections list",
  menuType: "slash",
  description: "List all self-role sections.",
  options: [],
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: true,
  kind: "ok",
  recordingFile: "slash/selfolressections__list.json",
};

export = command;
