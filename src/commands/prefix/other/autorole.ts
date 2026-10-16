import type { Command } from '../../../core/types';

const command: Command = {
  name: "autorole",
  aliases: [],
  description: "Configures the autorole system for the server.",
  usage: "<roleMentionOrID>",
  category: "security",
  logic: null,
  ai: null,
  permissions: [],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "ok",
  recordingFile: "prefix/autorole.json",
};

export = command;
