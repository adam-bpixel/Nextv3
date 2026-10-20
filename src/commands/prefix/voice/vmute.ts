import type { Command } from '../../../core/types';

const command: Command = {
  name: "vmute",
  aliases: [],
  description: "Server mutes a user in a voice channel.",
  usage: "<user mention or ID> <duration> <reason> (e.g., 1h being loud, 30m mic spam)",
  category: "moderation",
  logic: "vmute",
  ai: null,
  permissions: ["mute_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: null,
};

export = command;
