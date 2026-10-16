import type { Command } from '../../../core/types';

const command: Command = {
  name: "reply-list",
  aliases: [],
  description: "Show reply list stored in data",
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
  recordingFile: "prefix/reply_list.json",
};

export = command;
