import type { Command } from '../../../core/types';

const command: Command = {
  name: "autoreplyrole",
  aliases: [],
  description: "Allow or disallow an auto-reply for a specific role",
  usage: "<role mention/ID> <allow/disallow>",
  category: "reply",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/autoreplyrole.json",
};

export = command;
