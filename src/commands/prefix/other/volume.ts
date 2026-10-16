import type { Command } from '../../../core/types';

const command: Command = {
  name: "volume",
  aliases: [],
  description: "Show or change the player volume.",
  usage: "",
  category: "music",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: true,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/volume.json",
};

export = command;
