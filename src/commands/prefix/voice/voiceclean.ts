import type { Command } from '../../../core/types';

const command: Command = {
  name: "voiceclean",
  aliases: [],
  description: "Disconnect all movable members from a voice channel.",
  usage: "[voice channel mention or ID]",
  category: "moderation",
  logic: "voiceclean",
  ai: null,
  permissions: ["move_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
