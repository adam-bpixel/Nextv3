import type { Command } from '../../../core/types';

const command: Command = {
  name: "channel-info",
  aliases: [],
  description: "Show detailed info about a channel",
  usage: "",
  category: "Information",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/channel_info.json",
};

export = command;
