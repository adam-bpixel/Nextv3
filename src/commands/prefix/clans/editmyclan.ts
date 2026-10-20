import type { Command } from '../../../core/types';

const command: Command = {
  name: "editmyclan",
  aliases: [],
  description: "Edit your own clan's name, tag, color, or avatar (leader only).",
  usage: "<name|tag|color|avatar> <value>",
  category: "clans",
  logic: "clanEditSelf",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: null,
};

export = command;
