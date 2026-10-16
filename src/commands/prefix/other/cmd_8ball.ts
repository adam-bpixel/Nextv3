import type { Command } from '../../../core/types';

const command: Command = {
  name: "8ball",
  aliases: [],
  description: "Ask the magic 8-ball a question.",
  usage: "<your question>",
  category: "fun",
  logic: "8ball",
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/cmd_8ball.json",
};

export = command;
