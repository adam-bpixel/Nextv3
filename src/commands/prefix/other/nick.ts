import type { Command } from '../../../core/types';

const command: Command = {
  name: "nick",
  aliases: [],
  description: "Change or reset a member nickname.",
  usage: "<user mention or ID> <new nickname|reset>",
  category: "moderation",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/nick.json",
};

export = command;
