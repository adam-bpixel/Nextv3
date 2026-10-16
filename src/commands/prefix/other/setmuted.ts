import type { Command } from '../../../core/types';

const command: Command = {
  name: "setmuted",
  aliases: [],
  description: "Set which role gets assigned when using the mute command.",
  usage: "<role>",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/setmuted.json",
};

export = command;
