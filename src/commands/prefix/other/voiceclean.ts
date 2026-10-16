import type { Command } from '../../../core/types';

const command: Command = {
  name: "voiceclean",
  aliases: [],
  description: "Disconnect all movable members from a voice channel.",
  usage: "[voice channel mention or ID]",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/voiceclean.json",
};

export = command;
