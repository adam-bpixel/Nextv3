import type { Command } from '../../../core/types';

const command: Command = {
  name: "autoreply",
  aliases: [],
  description: "Add auto-reply with bot in server",
  usage: "<trigger> <response>",
  category: "reply",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/autoreply.json",
};

export = command;
