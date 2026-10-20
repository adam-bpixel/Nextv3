import type { Command } from '../../../core/types';

const command: Command = {
  name: "channel-info",
  aliases: [],
  description: "Show detailed info about a channel",
  usage: "[channel]",
  category: "Information",
  logic: "channelinfo",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
