import type { Command } from '../../../core/types';

const command: Command = {
  name: "poll",
  aliases: [],
  description: "Enable or disable polls in the channel, or make a poll $poll <on|off> OR $poll <poll question>",
  usage: "<on|off> OR &poll <poll question>",
  category: "admin",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/poll.json",
};

export = command;
