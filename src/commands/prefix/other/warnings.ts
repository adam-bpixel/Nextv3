import type { Command } from '../../../core/types';

const command: Command = {
  name: "warnings",
  aliases: [],
  description: "Show current warning state for a user.",
  usage: "<user mention or ID>",
  category: "Warning",
  logic: "warnings",
  ai: null,
  permissions: ["moderate_members"],
  ownerOnly: false,
  cooldown: 0,
  voice: false,
  dm: false,
  kind: "usage",
  recordingFile: "prefix/warnings.json",
};

export = command;
