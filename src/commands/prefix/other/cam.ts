import type { Command } from '../../../core/types';

const command: Command = {
  name: "cam",
  aliases: [],
  description: "Enable or disable Cam in the channel.",
  usage: "<enable|disable> [channel]",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/cam.json",
};

export = command;
