import type { Command } from '../../../core/types';

const command: Command = {
  name: "reply-reset",
  aliases: [],
  description: "Reset all auto-reply entries in the server",
  usage: "",
  category: "reply",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/reply_reset.json",
};

export = command;
