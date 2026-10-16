import type { Command } from '../../../core/types';

const command: Command = {
  name: "activity",
  aliases: [],
  description: "Enable or disable activity in the channel.",
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
  recordingFile: "prefix/activity.json",
};

export = command;
